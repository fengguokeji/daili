import { NextRequest, NextResponse } from 'next/server';

// 指定使用 Edge Runtime (Vercel 和 Netlify 均支持，且支持流式传输)
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const urlObj = new URL(req.url);
  const targetUrlStr = urlObj.searchParams.get('url');

  if (!targetUrlStr) {
    return new Response("缺少 url 参数", { status: 400 });
  }

  let targetUrl = decodeURIComponent(targetUrlStr);
  
  // 补全协议
  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = "http://" + targetUrl;
  }

  // 拼接剩余参数
  // 注意：req.nextUrl.searchParams 包含了所有 query，我们需要排除 'url'
  const currentParams = new URLSearchParams(urlObj.searchParams);
  currentParams.delete('url');
  if ([...currentParams].length > 0) {
    const sep = targetUrl.includes("?") ? "&" : "?";
    targetUrl += sep + currentParams.toString();
  }

  try {
    // 1. 准备 Headers
    const headers = new Headers();
    req.headers.forEach((val, key) => {
      // 过滤掉一些特定的头，防止 Cloudflare 拦截
      if (!['host', 'content-length', 'transfer-encoding', 'connection', 'accept-encoding'].includes(key.toLowerCase())) {
        headers.set(key, val);
      }
    });

    // 伪造 UA
    if (!headers.get('user-agent')) {
      headers.set('user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    }

    // 2. 准备 Body (直接透传流)
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : req.body;

    // 3. 发起请求
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
      redirect: 'manual',
      // Edge runtime 中 fetch 通常自动处理流，不需要 duplex: 'half'
    });

    // 4. 处理跳转
    const proxyBase = "/api/proxy?url=";
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (location) {
        const redirectUrl = `${proxyBase}${encodeURIComponent(new URL(location, targetUrl).href)}`;
        return new Response(null, {
          status: response.status,
          headers: { Location: redirectUrl }
        });
      }
    }

    // 5. 准备响应头
    const resHeaders = new Headers(response.headers);
    resHeaders.delete('content-encoding'); // 避免 gzip 问题
    resHeaders.delete('content-length'); // 重新计算或流式传输

    const contentType = resHeaders.get('content-type') || "";
    
    // ============================================================
    // 分支 A: HTML 处理 (Edge 环境下缓冲修改)
    // ============================================================
    if (contentType.includes('text/html')) {
      let html = await response.text();
      const baseUrl = new URL(targetUrl);
      const proxyBaseTag = `${proxyBase}${encodeURIComponent(baseUrl.origin + "/")}`;

      // 注入 <base>
      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, (match) => `${match}\n<base href="${proxyBaseTag}">`);
      } else {
        html = `<head><base href="${proxyBaseTag}"></head>\n` + html;
      }

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

      // 替换常见静态资源链接 (简单正则)
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

      return new Response(html, {
        status: response.status,
        headers: resHeaders
      });
    }

    // ============================================================
    // 分支 B: 其他文件 (直接透传流 - 解决 Netlify 超时问题)
    // ============================================================
    return new Response(response.body, {
      status: response.status,
      headers: resHeaders
    });

  } catch (err) {
    console.error("Proxy Error:", err);
    return new Response(`Proxy Error: ${err.message}`, { status: 502 });
  }
}
