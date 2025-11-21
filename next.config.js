/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 使用 fallback 策略，确保 /api/proxy 等存在的路由优先被处理
  // 只有当路径不存在时，才重写到首页
  async rewrites() {
    return {
      fallback: [
        {
          source: '/:path*',
          destination: '/',
        },
      ],
    };
  },
};

module.exports = nextConfig;
