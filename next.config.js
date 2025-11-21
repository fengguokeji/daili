/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 这是一个跨平台通用的重写规则
  // Vercel 和 Netlify (通过 Next.js Runtime) 都能读取并执行
  async rewrites() {
    return [
      {
        // 将所有未匹配的路径重定向到首页
        // 注意：API 路由 /api/proxy 优先级最高，不会受此影响
        source: '/:path*',
        destination: '/',
      },
    ];
  },
};

module.exports = nextConfig;
