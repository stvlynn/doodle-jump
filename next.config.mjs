/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  eslint: {
    // 在构建过程中警告而不是错误
    ignoreDuringBuilds: true,
  },
  // 添加图片域名白名单
  images: {
    domains: ['pbs.twimg.com', 'abs.twimg.com', 'twi.am'],
  },
  // 环境变量
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default nextConfig; 