/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 根据环境变量决定是否启用静态导出
  ...(process.env.NODE_ENV === 'production' && process.env.BUILD_FOR_EXPORT === 'true' ? {
    output: 'export', // 启用静态导出用于GitHub Pages
    trailingSlash: true, // GitHub Pages需要尾斜杠
    images: {
      unoptimized: true // 静态导出必须禁用图片优化
    },
    // 如果部署到 GitHub Pages 的子路径，取消注释并修改下面的行
    // basePath: '/LovePlanner',
    // assetPrefix: '/LovePlanner',
  } : {}),
}

module.exports = nextConfig 