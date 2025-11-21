// pages/api/proxy.js
import { URL, URLSearchParams } from 'url';

// 1. 【核心】强制全局禁用 SSL 证书验证
// 这是唯一能解决 "UNABLE_TO_GET_ISSUER_CERT_LOCALLY" 的方法
// 仅在 Node.js 环境下有效，Edge Runtime 不支持此操作
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export const config = {
  api: {
    bodyParser: false, // 关闭 Next.js 默认解析，保留原始流
    responseLimit: false, // 解除 Vercel/Netlify 的响应体大小限制
    externalResolver: true,
  },
};

export default async function handler(req, res) {
  const { url, ...restQuery } = req.query;

  if (!url) {
    return res.status(400).send("缺少 url 参数");
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
    // ===== 1. 请求头准备 =====
    // 过滤掉可能导致 Cloudflare 拦截的头
    const headers = {};
    Object.entries(req.headers).forEach(([key, value]) => {
      if (!['host', 'content-length', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });
    
    // 伪造 UA
    if (!headers['user-agent']) {
        headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    }

    // ===== 2. 请求体准备 =====
    const bodyChunks = [];
    // 仅非 GET/HEAD 请求读取 Body
    if (!['GET', 'HEAD'].includes(req.method?.toUpperCase())) {
        for await (const chunk of req) {
            bodyChunks.push(chunk);
        }
    }
    const body = bodyChunks.length > 0 ? Buffer.concat(bodyChunks) : undefined;
    const proxyBase = "/api/proxy?url=";

    // ===== 3. 发起请求 =====
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: "manual", 
      duplex: body ? 'half' : undefined, // Node 18+ 必需
    }).catch(err => {
      console.error("Fetch error:", err);
      throw new Error(`连接目标失败: ${err.message}`);
    });

    // ===== 4. 处理跳转 =====
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

    // ============================================================
    // 分支 A: HTML 处理
    // ============================================================
    if (contentType.includes("text/html")) {
      let html = await response.text();
      const proxyBaseTag = `${proxyBase}${encodeURIComponent(baseUrl.origin + "/")}`;

      // 注入 <base>
      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, (match) => `${match}\n<base href="${proxyBaseTag}">`);
      } else {
        html = `<head><base href="${proxyBaseTag}"></head>\n` + html;
      }

      // 静态资源替换
      const replaceUrl = (match, attr, link) => {
          try {
             if (/^(https?:)?\/\//i.test(link)) {
                if (link.startsWith("//")) link = baseUrl.protocol + link;
                return `${attr}="${proxyBase}${encodeURIComponent(link)}"`;
             } else if (link.startsWith("/")) {
                return `${attr}="${proxyBase}${encodeURIComponent(baseUrl.origin + link)}"`;
             } else if (/^(javascript:|#|data:|mailto:)/i.test(link)) {
                return match;
             } else {
                return `${attr}="${proxyBase}${encodeURIComponent(new URL(link, baseUrl).href)}"`;
             }
          } catch(e) { return match; }
      };

      html = html.replace(/(href|src)=["']([^"']+)["']/gi, replaceUrl);
      html = html.replace(/<form([^>]*?)action=["']([^"']+)["']([^>]*)>/gi, (m, b, a, aft) => {
          const newActionTag = replaceUrl(m, `action`, a);
          const newAction = newActionTag.match(/action="([^"]+)"/)?.[1] || a;
          return `<form${b}action="${newAction}"${aft}>`;
      });

      // 注入 Hook 脚本
      const hookScript = `
      <script>
        (function(){
          const proxyBase = '${proxyBase}';
          function proxify(url) {
            try {
              if (!url || url.match(/^(javascript:|#|data:|mailto:)/)) return url;
              const u = new URL(url, location.href);
              return proxyBase + encodeURIComponent(u.href);
            } catch(e) { return url; }
          }
          const _fetch = window.fetch;
          window.fetch = function(input, init){
            if(typeof input === 'string') input = proxify(input);
            else if(input instanceof Request) input = new Request(proxify(input.url), input);
            return _fetch.call(this, input, init);
          };
          const _open = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function(m, u, ...a){ return _open.call(this, m, proxify(u), ...a); };
        })();
      </script>`;
      html = html.replace(/<\/body>/i, hookScript + "</body>");
      
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);

    // ============================================================
    // 分支 B: CSS/JS 处理
    // ============================================================
    } else if (contentType.includes("text/css")) {
      let css = await response.text();
      css = css.replace(/url\(([^)]+)\)/gi, (match, rawUrl) => {
         try {
            let cleanUrl = rawUrl.trim().replace(/^['"]|['"]$/g, "");
            if(cleanUrl.match(/^(data:|#)/)) return match;
            const absUrl = new URL(cleanUrl, targetUrl).href;
            return `url(${proxyBase}${encodeURIComponent(absUrl)})`;
         } catch(e) { return match; }
      });
      res.setHeader("Content-Type", "text/css; charset=utf-8");
      res.send(css);
    
    } else if (contentType.includes("javascript")) {
      let js = await response.text();
      js = js.replace(/fetch\((['"])(https?:\/\/.+?)\1\)/gi, (m, q, link) => 
          `fetch(${q}${proxyBase}${encodeURIComponent(link)}${q})`);
      res.setHeader("Content-Type", contentType);
      res.send(js);

    // ============================================================
    // 分支 C: 文件下载 (流式透传)
    // ============================================================
    } else {
      res.status(response.status);
      response.headers.forEach((value, key) => {
        if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
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
    if (!res.headersSent) res.status(502).send(`请求错误：${err.message}`);
    else res.end();
  }
}
