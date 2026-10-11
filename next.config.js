const bundleAnalyzer = require('@next/bundle-analyzer')
const withBundleAnalyzer = bundleAnalyzer({
    enabled: false,
    openAnalyzer: true,
})


module.exports = withBundleAnalyzer({
    swcMinify: true,
    crossOrigin: 'anonymous',
    reactStrictMode: false,
    env: {
        STATIC_URL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:1947",
    },
    // The upstream editor still has type debt in unfinished, unmounted components.
    // Keep static export available while `pnpm typecheck` reports that debt explicitly.
    typescript: {
        ignoreBuildErrors: true,
    },
    // typescript: {
    //     ignoreBuildErrors: true,
    // },
    // webpack: (config) => {
    //     config.externals = [...config.externals, { canvas: 'canvas' }];
    //     return config;
    // },
    // experimental: {
    //     serverActions: {
    //         allowedOrigins: []
    //     },
    // },

    // async redirects() {
    //     return [
    //         {
    //             source: "/home",
    //             destination: "/",
    //             permanent: false,
    //         }]
    // }


    output: 'export',
    // 禁用图像优化，因为它需要 Next.js 服务器
    images: {
        unoptimized: true,
    },
})
