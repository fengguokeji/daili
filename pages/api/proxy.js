// pages/api/proxy.js

export const config = {
  api: {
    bodyParser: false, // 保留原始请求体
  },
};

export default async function handler(req, res) {
  const { url, ...restQuery } = req.query;

  if (!url) {
    res.status(400).send("缺少 url 参数");
    return;
  }

  let targetUrl = decodeURIComponent(url);

  // 补全协议
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = "http://" + targetUrl;
  }

  // 拼接额外的 query 参数
  const searchParams = new URLSearchParams(restQuery);
  if ([...searchParams].length > 0) {
    const sep = targetUrl.includes("?") ? "&" : "?";
    targetUrl += sep + searchParams.toString();
  }

  try {
    // ===== 请求头 =====
    const headers = { ...req.headers };
    delete headers.host;

    // ===== 请求体 =====
    const bodyChunks = [];
    for await (const chunk of req) {
      bodyChunks.push(chunk);
    }
    const body =
      ["GET", "HEAD"].includes(req.method) || bodyChunks.length === 0
        ? undefined
        : Buffer.concat(bodyChunks);

    const proxyBase = "/api/proxy?url=";

    // ===== 发起代理请求 =====
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: "manual", // 保留 301/302 手动处理
    });

    // ===== 处理 301/302 跳转 =====
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (location) {
        const redirectUrl = `${proxyBase}${encodeURIComponent(
          new URL(location, targetUrl).href
        )}`;
        res.writeHead(302, { Location: redirectUrl });
        res.end();
        return;
      }
    }

    const contentType = response.headers.get("content-type") || "";
    const baseUrl = new URL(targetUrl);

    // ===== 处理 HTML =====
    if (contentType.includes("text/html")) {
      let html = await response.text();

      const proxyBaseTag = `${proxyBase}${encodeURIComponent(baseUrl.origin + "/")}`;

      // 注入 <base>
      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, (match) => {
          return `${match}\n<base href="${proxyBaseTag}">`;
        });
      } else {
        html = `<head><base href="${proxyBaseTag}"></head>\n` + html;
      }

      // 替换静态 href / src
      html = html.replace(
        /(href|src)=["']([^"']+)["']/gi,
        (match, attr, link) => {
          if (/^(https?:)?\/\//i.test(link)) {
            if (link.startsWith("//")) link = baseUrl.protocol + link;
            return `${attr}="${proxyBase}${encodeURIComponent(link)}"`;
          } else if (link.startsWith("/")) {
            return `${attr}="${proxyBase}${encodeURIComponent(baseUrl.origin + link)}"`;
          } else if (/^(javascript:|#)/i.test(link)) {
            return match;
          } else {
            return `${attr}="${proxyBase}${encodeURIComponent(new URL(link, baseUrl).href)}"`;
          }
        }
      );

      // 替换静态 form action
      html = html.replace(
        /<form([^>]*?)action=["']([^"']+)["']([^>]*)>/gi,
        (match, before, action, after) => {
          let newAction = action;
          if (/^(https?:)?\/\//i.test(action)) {
            if (action.startsWith("//")) action = baseUrl.protocol + action;
            newAction = `${proxyBase}${encodeURIComponent(action)}`;
          } else if (action.startsWith("/")) {
            newAction = `${proxyBase}${encodeURIComponent(baseUrl.origin + action)}`;
          } else {
            newAction = `${proxyBase}${encodeURIComponent(new URL(action, baseUrl).href)}`;
          }
          return `<form${before}action="${newAction}"${after}>`;
        }
      );

      // ===== 注入全局 JS Hook 动态 URL =====
      const hookScript = `
      <script>
        (function(){
          const proxyBase = '${proxyBase}';
          function proxifyUrl(url) {
            try {
              if (!url || url.startsWith('javascript:') || url.startsWith('#')) return url;
              const u = new URL(url, location.href);
              return proxyBase + encodeURIComponent(u.href);
            } catch(e) { return url; }
          }

          // Hook location
          const originalAssign = window.location.assign;
          window.location.assign = function(url){ return originalAssign.call(this, proxifyUrl(url)); };
          const originalReplace = window.location.replace;
          window.location.replace = function(url){ return originalReplace.call(this, proxifyUrl(url)); };
          Object.defineProperty(window.location, 'href', {
            set: function(url){ originalAssign.call(window.location, proxifyUrl(url)); }
          });

          // Hook pushState / replaceState
          const _push = history.pushState;
          history.pushState = function(s, t, url){ return _push.call(this, s, t, proxifyUrl(url)); };
          const _replace = history.replaceState;
          history.replaceState = function(s, t, url){ return _replace.call(this, s, t, proxifyUrl(url)); };

          // 替换 a 标签 href / form action
          document.addEventListener('DOMContentLoaded', ()=>{
            document.querySelectorAll('a[href]').forEach(a=>{
              a.href = proxifyUrl(a.href);
            });
            document.querySelectorAll('form[action]').forEach(f=>{
              f.action = proxifyUrl(f.action);
            });
          });

          // Hook fetch
          const _fetch = window.fetch;
          window.fetch = function(input, init){
            if(typeof input === 'string') input = proxifyUrl(input);
            else if(input instanceof Request) input = new Request(proxifyUrl(input.url), input);
            return _fetch.call(this, input, init);
          };

          // Hook XMLHttpRequest open
          const _open = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function(method, url, ...rest){
            return _open.call(this, method, proxifyUrl(url), ...rest);
          };
        })();
      </script>
      `;

      html = html.replace(/<\/body>/i, hookScript + "</body>");

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);

      // ===== 处理 CSS =====
    } else if (contentType.includes("text/css")) {
      let css = await response.text();
      css = css.replace(/url\(([^)]+)\)/gi, (match, rawUrl) => {
        let cleanUrl = rawUrl.trim().replace(/^['"]|['"]$/g, "");
        if (/^(https?:)?\/\//i.test(cleanUrl)) {
          if (cleanUrl.startsWith("//")) cleanUrl = baseUrl.protocol + cleanUrl;
          return `url(${proxyBase}${encodeURIComponent(cleanUrl)})`;
        } else if (cleanUrl.startsWith("/")) {
          return `url(${proxyBase}${encodeURIComponent(baseUrl.origin + cleanUrl)})`;
        } else if (cleanUrl.startsWith("data:")) {
          return match;
        } else {
          return `url(${proxyBase}${encodeURIComponent(new URL(cleanUrl, baseUrl).href)})`;
        }
      });
      res.setHeader("Content-Type", "text/css; charset=utf-8");
      res.send(css);

      // ===== 处理 JS =====
    } else if (
      contentType.includes("application/javascript") ||
      contentType.includes("text/javascript")
    ) {
      let js = await response.text();
      js = js.replace(
        /fetch\((['"])(.+?)\1\)/gi,
        (match, quote, link) => {
          return `fetch(${quote}${proxyBase}${encodeURIComponent(
            new URL(link, baseUrl).href
          )}${quote})`;
        }
      );
      js = js.replace(
        /open\((['"])(GET|POST|PUT|DELETE|HEAD|OPTIONS)\1\s*,\s*(['"])(.+?)\3/gi,
        (match, q1, method, q2, link) => {
          return `open(${q1}${method}${q1}, ${q2}${proxyBase}${encodeURIComponent(
            new URL(link, baseUrl).href
          )}${q2}`;
        }
      );
      js = js.replace(/url:\s*(['"])(.+?)\1/gi, (match, quote, link) => {
        return `url: ${quote}${proxyBase}${encodeURIComponent(
          new URL(link, baseUrl).href
        )}${quote}`;
      });
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.send(js);

      // ===== 其他文件直接透传 =====
    } else {
      res.status(response.status);
      response.headers.forEach((value, key) => {
        if (!["content-encoding", "content-length"].includes(key)) {
          res.setHeader(key, value);
        }
      });
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      res.end();
    }
  } catch (err) {
    res.status(502).send(`请求错误：${err.message}`);
  }
}
