import { URL } from 'url';

export const config = {
  api: {
    // 关闭 Next.js 默认的 Body 解析，直接透传 Stream，防止大文件上传撑爆内存
    bodyParser: false,
    // 解除响应大小限制
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  const { url, ...restQuery } = req.query;

  if (!url) {
    return res.status(400).send("Missing 'url' query parameter");
  }

  // 1. 构建目标 URL
  let targetUrlStr = decodeURIComponent(url);
  // 自动补全协议
  if (!/^https?:\/\//i.test(targetUrlStr)) {
    targetUrlStr = "http://" + targetUrlStr;
  }

  // 简单防止 SSRF (访问内网)
  try {
    const u = new URL(targetUrlStr);
    if (['localhost', '127.0.0.1', '::1'].includes(u.hostname)) {
      return res.status(403).send("Forbidden: Localhost access denied");
    }
  } catch (e) {
    return res.status(400).send("Invalid URL format");
  }

  // 拼接剩余的 Query 参数 (例如 ?id=1&page=2)
  const searchParams = new URLSearchParams(restQuery);
  if ([...searchParams].length > 0) {
    const sep = targetUrlStr.includes("?") ? "&" : "?";
    targetUrlStr += sep + searchParams.toString();
  }

  // 定义代理的基础路径，方便后续使用
  const proxyBase = "/api/proxy?url=";

  try {
    const targetUrlObj = new URL(targetUrlStr);

    // 2. 准备请求头
    const headers = new Headers();
    // 复制原有 Header，但剔除 Host (由 fetch 自动设置) 和一些可能导致问题的 Header
    Object.entries(req.headers).forEach(([key, value]) => {
      if (!['host'].includes(key)) {
        headers.set(key, value);
      }
    });

    // 3. 准备请求体 (流式透传)
    // 如果是 GET/HEAD，body 必须为 undefined
    // 如果是 POST/PUT，直接使用 req (IncomingMessage) 作为 stream
    const requestBody = ['GET', 'HEAD'].includes(req.method) ? undefined : req;

    // 4. 发起请求
    const response = await fetch(targetUrlStr, {
      method: req.method,
      headers: headers,
      body: requestBody,
      redirect: "manual", // 手动处理跳转
    });

    // 5. 处理响应头
    // 转发 Set-Cookie，但需要去除 Domain 属性，否则浏览器会拒绝写入
    response.headers.forEach((val, key) => {
      if (key === 'set-cookie') {
        // 粗暴移除 Domain 和 Secure (如果本地不是https)，让 Cookie 种在当前域下
        const newCookie = val.replace(/Domain=[^;]+;?/gi, '').replace(/Secure;?/gi, '');
        res.appendHeader('Set-Cookie', newCookie);
      } else if (!['content-encoding', 'content-length'].includes(key)) {
        // 剔除编码和长度头，因为我们可能会修改内容
        res.setHeader(key, val);
      }
    });

    // 6. 处理 3XX 跳转
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (location) {
        // 将相对路径转为绝对路径，再包裹代理
        const absoluteLocation = new URL(location, targetUrlStr).href;
        const redirectUrl = `${proxyBase}${encodeURIComponent(absoluteLocation)}`;
        res.writeHead(response.status, { Location: redirectUrl });
        return res.end();
      }
    }

    const contentType = response.headers.get("content-type") || "";

    // ============================================================
    // 策略 A: HTML 处理 (注入 <base> 和 Hook 脚本)
    // ============================================================
    if (contentType.includes("text/html")) {
      let html = await response.text();
      const origin = targetUrlObj.origin;
      const proxyOrigin = `${proxyBase}${encodeURIComponent(origin + "/")}`;

      // 1. 注入 <base href="...">
      // 这能解决绝大多数 img src, link href, script src 的相对路径问题
      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, (match) => `${match}\n<base href="${proxyOrigin}">`);
      } else {
        html = `<head><base href="${proxyOrigin}"></head>\n` + html;
      }

      // 2. 注入客户端 Hook 脚本
      // 在浏览器端拦截 fetch, xhr, window.open 等动态请求
      const hookScript = `
      <script>
        (function(){
          const proxyBase = '${proxyBase}';
          
          // 核心函数：将任意 URL 转换为代理 URL
          function proxify(url) {
             if (!url) return url;
             if (typeof url !== 'string') return url;
             // 忽略特殊协议
             if (url.match(/^(javascript:|#|data:|blob:|mailto:|tel:)/i)) return url;
             // 已经代理过了则跳过
             if (url.includes('/api/proxy?url=')) return url;
             
             try {
                // 利用当前页面的 <base> 解析相对路径
                const u = new URL(url, document.baseURI);
                return proxyBase + encodeURIComponent(u.href);
             } catch(e) { return url; }
          }

          // Hook: window.fetch
          const _fetch = window.fetch;
          window.fetch = function(input, init) {
            if (typeof input === 'string') input = proxify(input);
            else if (input instanceof Request) {
                // Request 对象是只读的，需要克隆重建
                input = new Request(proxify(input.url), input);
            }
            return _fetch.call(this, input, init);
          };

          // Hook: XMLHttpRequest
          const _open = XMLHttpRequest.prototype.open;
          XMLHttpRequest.prototype.open = function(method, url, ...args) {
            return _open.call(this, method, proxify(url), ...args);
          };
          
          // Hook: window.open
          const _winOpen = window.open;
          window.open = function(url, name, features) {
             return _winOpen.call(this, proxify(url), name, features);
          };

          // 兜底：点击链接时强制检查
          document.addEventListener('click', e => {
            const a = e.target.closest('a');
            if(a && a.href) {
               // 如果是站外链接，或者已经被 base 标签处理过的链接，这里再次确保它走代理
               // 这里主要处理 JS 动态生成的 A 标签
               const newHref = proxify(a.href);
               if(a.href !== newHref) {
                  e.preventDefault();
                  window.location.href = newHref;
               }
            }
          }, true);
        })();
      </script>
      `;

      // 将脚本注入到 body 底部
      html = html.replace("</body>", hookScript + "</body>");
      
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } 
    
    // ============================================================
    // 策略 B: CSS 处理 (替换 url(...))
    // ============================================================
    else if (contentType.includes("text/css")) {
      let css = await response.text();
      // CSS 中的相对路径不受 <base> 影响，必须手动替换
      css = css.replace(/url\((['"]?)([^"')]+)\1\)/gi, (match, quote, url) => {
        if (url.trim().match(/^(data:|#)/i)) return match;
        try {
          const absoluteUrl = new URL(url, targetUrlStr).href;
          return `url(${proxyBase}${encodeURIComponent(absoluteUrl)})`;
        } catch(e) { return match; }
      });
      
      res.setHeader("Content-Type", "text/css; charset=utf-8");
      res.send(css);
    }

    // ============================================================
    // 策略 C: 其他所有文件 (JS/图片/字体/视频) -> 流式透传
    // ============================================================
    else {
      // 包含 JS 文件：绝对不要修改 JS 内容，否则极易破坏语法。
      // 依靠上面的 Hook 脚本在运行时处理 JS 发出的请求。
      
      res.status(response.status);
      
      if (!response.body) {
        res.end();
        return;
      }

      // 使用 Web Streams Reader 进行流式传输，节省内存
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
    res.status(502).send(`Proxy Error: ${err.message}`);
  }
}
