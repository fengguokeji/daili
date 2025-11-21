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
    // ===== 请求头处理 (关键修复) =====
    // 不直接复制所有 header，而是过滤掉可能导致 fetch failed 的 header
    const headers = {};
    const blockedHeaders = ['host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive'];
    
    Object.entries(req.headers).forEach(([key, value]) => {
      if (!blockedHeaders.includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });

    // 强制设置 User-Agent (如果是 Cloudflare，有时候空 UA 会被拦)
    if (!headers['user-agent']) {
      headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    }

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
    // 增加 catch 捕获具体的网络错误
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
      // 某些 Node 版本需要这个配置来防止 Keep-Alive 错误
      keepalive: false, 
    }).catch(err => {
      throw new Error(`连接目标服务器失败: ${err.cause ? err.cause.code : err.message}`);
    });

    // ===== 处理 301/302 跳转 =====
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (location) {
        const redirectUrl = `${proxyBase}${encodeURIComponent(
          new URL(location, targetUrl).href
        )}`;
        res.writeHead(response.status, { Location: redirectUrl });
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
            try {
                return `${attr}="${proxyBase}${encodeURIComponent(new URL(link, baseUrl).href)}"`;
            } catch (e) { return match; }
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
            try {
                newAction = `${proxyBase}${encodeURIComponent(new URL(action, baseUrl).href)}`;
            } catch(e) { return match; }
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
          try {
              return `url(${proxyBase}${encodeURIComponent(new URL(cleanUrl, baseUrl).href)})`;
          } catch(e) { return match; }
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
            try {
               return `fetch(${quote}${proxyBase}${encodeURIComponent(new URL(link, baseUrl).href)}${quote})`;
            } catch(e) { return match; }
        }
      );
      // 增加 try-catch 防止 URL 解析失败导致 JS 报错
      js = js.replace(
        /open\((['"])(GET|POST|PUT|DELETE|HEAD|OPTIONS)\1\s*,\s*(['"])(.+?)\3/gi,
        (match, q1, method, q2, link) => {
            try {
                return `open(${q1}${method}${q1}, ${q2}${proxyBase}${encodeURIComponent(new URL(link, baseUrl).href)}${q2}`;
            } catch(e) { return match; }
        }
      );
      js = js.replace(/url:\s*(['"])(.+?)\1/gi, (match, quote, link) => {
          try {
            return `url: ${quote}${proxyBase}${encodeURIComponent(new URL(link, baseUrl).href)}${quote}`;
          } catch(e) { return match; }
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
    console.error("Proxy Error:", err);
    // 返回详细的错误代码，方便排查
    res.status(502).send(`请求错误：${err.message} (Cause: ${err.cause ? err.cause.code : 'Unknown'})`);
  }
}
