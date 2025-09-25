export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    res.status(400).send('缺少 url 参数');
    return;
  }

  let targetUrl = decodeURIComponent(url);

  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = 'http://' + targetUrl;
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        ...req.headers,
        host: new URL(targetUrl).host,
      },
    });

    if (!response.ok) {
      res.status(response.status).send(`请求失败：${response.statusText}`);
      return;
    }

    const contentType = response.headers.get('content-type') || '';
    const baseUrl = new URL(targetUrl);
    const proxyBase = '/api/proxy?url=';

    // ===== 处理 HTML =====
    if (contentType.includes('text/html')) {
      let html = await response.text();

      // 注入 <base> 标签，确保相对路径也能正确代理
      const proxyBaseTag = `${proxyBase}${encodeURIComponent(baseUrl.origin + '/')}`;
      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, match => {
          return `${match}\n<base href="${proxyBaseTag}">`;
        });
      } else {
        // 如果页面没有 <head>，就在开头加一个
        html = `<head><base href="${proxyBaseTag}"></head>\n` + html;
      }

      // 替换绝对/相对链接（兜底方案，确保所有跳转都走代理）
      html = html.replace(
        /(href|src)=["']([^"']+)["']/gi,
        (match, attr, link) => {
          if (link.startsWith('http://') || link.startsWith('https://')) {
            return `${attr}="${proxyBase}${encodeURIComponent(link)}"`;
          } else if (link.startsWith('//')) {
            return `${attr}="${proxyBase}${encodeURIComponent(baseUrl.protocol + link)}"`;
          } else if (link.startsWith('/')) {
            return `${attr}="${proxyBase}${encodeURIComponent(baseUrl.origin + link)}"`;
          } else if (link.startsWith('javascript:') || link.startsWith('#')) {
            return match;
          } else {
            return `${attr}="${proxyBase}${encodeURIComponent(new URL(link, baseUrl).href)}"`;
          }
        }
      );

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);

    // ===== 处理 CSS =====
    } else if (contentType.includes('text/css')) {
      let css = await response.text();

      css = css.replace(
        /url\(([^)]+)\)/gi,
        (match, rawUrl) => {
          let cleanUrl = rawUrl.trim().replace(/^['"]|['"]$/g, '');

          if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
            return `url(${proxyBase}${encodeURIComponent(cleanUrl)})`;
          } else if (cleanUrl.startsWith('//')) {
            return `url(${proxyBase}${encodeURIComponent(baseUrl.protocol + cleanUrl)})`;
          } else if (cleanUrl.startsWith('/')) {
            return `url(${proxyBase}${encodeURIComponent(baseUrl.origin + cleanUrl)})`;
          } else if (cleanUrl.startsWith('data:')) {
            return match;
          } else {
            return `url(${proxyBase}${encodeURIComponent(new URL(cleanUrl, baseUrl).href)})`;
          }
        }
      );

      res.setHeader('Content-Type', 'text/css; charset=utf-8');
      res.send(css);

    // ===== 处理 JS (动态请求) =====
    } else if (
      contentType.includes('application/javascript') ||
      contentType.includes('text/javascript')
    ) {
      let js = await response.text();

      // fetch("...")
      js = js.replace(/fetch\((['"])(.+?)\1\)/gi, (match, quote, link) => {
        return `fetch(${quote}${proxyBase}${encodeURIComponent(new URL(link, baseUrl).href)}${quote})`;
      });

      // XMLHttpRequest.open("GET", "...")
      js = js.replace(
        /open\((['"])(GET|POST|PUT|DELETE|HEAD|OPTIONS)\1\s*,\s*(['"])(.+?)\3/gi,
        (match, q1, method, q2, link) => {
          return `open(${q1}${method}${q1}, ${q2}${proxyBase}${encodeURIComponent(new URL(link, baseUrl).href)}${q2}`;
        }
      );

      // $.ajax({ url: "..." })
      js = js.replace(/url:\s*(['"])(.+?)\1/gi, (match, quote, link) => {
        return `url: ${quote}${proxyBase}${encodeURIComponent(new URL(link, baseUrl).href)}${quote}`;
      });

      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.send(js);

    // ===== 其他文件直接透传 =====
    } else {
      res.setHeader('Content-Type', contentType);
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
