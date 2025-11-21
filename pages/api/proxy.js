// pages/api/proxy.js

// 1. 【核心】全局禁用 SSL 证书验证 (解决 UNABLE_TO_GET_ISSUER_CERT_LOCALLY)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export const config = {
  api: {
    bodyParser: false, // 关闭 Next.js 默认解析，保留原始流
    responseLimit: false, // 解除 Vercel/Next.js 的响应体大小限制 (对大文件很重要)
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
    // ===== 请求头准备 =====
    const headers = { ...req.headers };
    
    // 2. 【核心】清理可能导致 Cloudflare 拦截或 Fetch 报错的头
    delete headers.host; 
    delete headers['content-length']; 
    delete headers['transfer-encoding'];
    delete headers.connection;
    
    // 伪造 UA 防止被拦截 (可选)
    if (!headers['user-agent']) {
        headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    }

    // ===== 请求体准备 =====
    const bodyChunks = [];
    for await (const chunk of req) {
      bodyChunks.push(chunk);
    }
    const body =
      ["GET", "HEAD"].includes(req.method) || bodyChunks.length === 0
        ? undefined
        : Buffer.concat(bodyChunks);

    const proxyBase = "/api/proxy?url=";

    // ===== 发起请求 =====
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: "manual", 
      // 3. 【核心】Node 18+ 必需参数
      duplex: body ? 'half' : undefined, 
    }).catch(err => {
      console.error("Fetch error:", err);
      throw new Error(`无法连接目标服务器: ${err.message}`);
    });

    // ===== 处理 3XX 跳转 =====
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
    // 分支 A: HTML 网页处理 (注入脚本，支持浏览)
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

      // 简单的静态资源替换
      html = html.replace(/(href|src)=["']([^"']+)["']/gi, (match, attr, link) => {
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
      });

      html = html.replace(/<form([^>]*?)action=["']([^"']+)["']([^>]*)>/gi, (match, before, action, after) => {
          try {
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
          } catch(e) { return match; }
      });

      // 注入 Client JS Hook
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
          
          // Hook window.open, fetch, xhr...
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
    // 分支 B: CSS 处理
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

    // ============================================================
    // 分支 C: JS 处理 (仅做 URL 替换，不校验语法，防止破坏)
    // ============================================================
    } else if (contentType.includes("javascript")) {
      let js = await response.text();
      // 极简替换，防止破坏代码
      js = js.replace(/fetch\((['"])(https?:\/\/.+?)\1\)/gi, (m, q, link) => 
          `fetch(${q}${proxyBase}${encodeURIComponent(link)}${q})`);
      res.setHeader("Content-Type", contentType);
      res.send(js);

    // ============================================================
    // 分支 D: 文件下载 (针对大文件的流式透传 + 进度条优化)
    // ============================================================
    } else {
      res.status(response.status);
      
      // 4. 【优化】透传 Content-Length 以显示进度条
      // 剔除 content-encoding (因为我们解压了) 和 transfer-encoding (防止块传输冲突)
      response.headers.forEach((value, key) => {
        if (!['content-encoding', 'transfer-encoding'].includes(key)) {
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
    res.status(502).send(`请求错误：${err.message}`);
  }
}
