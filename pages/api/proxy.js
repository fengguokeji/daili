// pages/api/proxy.js

export const config = {
  api: {
    bodyParser: false, // 保留原始请求体，方便透传
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
    // ===== 处理请求头 =====
    const headers = { ...req.headers };
    delete headers.host;

    // ===== 处理请求体 =====
    const bodyChunks = [];
    for await (const chunk of req) {
      bodyChunks.push(chunk);
    }
    const body =
      ["GET", "HEAD"].includes(req.method) || bodyChunks.length === 0
        ? undefined
        : Buffer.concat(bodyChunks);

    // ===== 发起代理请求 =====
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: "manual",
    });

    const contentType = response.headers.get("content-type") || "";
    const baseUrl = new URL(targetUrl);
    const proxyBase = "/api/proxy?url=";

    // ===== 处理 HTML =====
    if (contentType.includes("text/html")) {
      let html = await response.text();

      // 注入 <base>
      const proxyBaseTag = `${proxyBase}${encodeURIComponent(
        baseUrl.origin + "/"
      )}`;
      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, (match) => {
          return `${match}\n<base href="${proxyBaseTag}">`;
        });
      } else {
        html = `<head><base href="${proxyBaseTag}"></head>\n` + html;
      }

      // 替换资源路径 (href / src)
      html = html.replace(
        /(href|src)=["']([^"']+)["']/gi,
        (match, attr, link) => {
          if (link.startsWith("http://") || link.startsWith("https://")) {
            return `${attr}="${proxyBase}${encodeURIComponent(link)}"`;
          } else if (link.startsWith("//")) {
            return `${attr}="${proxyBase}${encodeURIComponent(
              baseUrl.protocol + link
            )}"`;
          } else if (link.startsWith("/")) {
            return `${attr}="${proxyBase}${encodeURIComponent(
              baseUrl.origin + link
            )}"`;
          } else if (
            link.startsWith("javascript:") ||
            link.startsWith("#")
          ) {
            return match; // 保持不变
          } else {
            return `${attr}="${proxyBase}${encodeURIComponent(
              new URL(link, baseUrl).href
            )}"`;
          }
        }
      );

      // 替换 <form action="...">
      html = html.replace(
        /<form([^>]*?)action=["']([^"']+)["']([^>]*)>/gi,
        (match, before, action, after) => {
          let newAction;
          if (action.startsWith("http://") || action.startsWith("https://")) {
            newAction = `${proxyBase}${encodeURIComponent(action)}`;
          } else if (action.startsWith("//")) {
            newAction = `${proxyBase}${encodeURIComponent(
              baseUrl.protocol + action
            )}`;
          } else if (action.startsWith("/")) {
            newAction = `${proxyBase}${encodeURIComponent(
              baseUrl.origin + action
            )}`;
          } else {
            newAction = `${proxyBase}${encodeURIComponent(
              new URL(action, baseUrl).href
            )}`;
          }
          return `<form${before}action="${newAction}"${after}>`;
        }
      );

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);

      // ===== 处理 CSS =====
    } else if (contentType.includes("text/css")) {
      let css = await response.text();

      css = css.replace(/url\(([^)]+)\)/gi, (match, rawUrl) => {
        let cleanUrl = rawUrl.trim().replace(/^['"]|['"]$/g, "");

        if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
          return `url(${proxyBase}${encodeURIComponent(cleanUrl)})`;
        } else if (cleanUrl.startsWith("//")) {
          return `url(${proxyBase}${encodeURIComponent(
            baseUrl.protocol + cleanUrl
          )})`;
        } else if (cleanUrl.startsWith("/")) {
          return `url(${proxyBase}${encodeURIComponent(
            baseUrl.origin + cleanUrl
          )})`;
        } else if (cleanUrl.startsWith("data:")) {
          return match;
        } else {
          return `url(${proxyBase}${encodeURIComponent(
            new URL(cleanUrl, baseUrl).href
          )})`;
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

      // fetch("...")
      js = js.replace(
        /fetch\((['"])(.+?)\1\)/gi,
        (match, quote, link) => {
          return `fetch(${quote}${proxyBase}${encodeURIComponent(
            new URL(link, baseUrl).href
          )}${quote})`;
        }
      );

      // XMLHttpRequest.open("GET", "...")
      js = js.replace(
        /open\((['"])(GET|POST|PUT|DELETE|HEAD|OPTIONS)\1\s*,\s*(['"])(.+?)\3/gi,
        (match, q1, method, q2, link) => {
          return `open(${q1}${method}${q1}, ${q2}${proxyBase}${encodeURIComponent(
            new URL(link, baseUrl).href
          )}${q2}`;
        }
      );

      // $.ajax({ url: "..." })
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
