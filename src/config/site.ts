const baseSiteConfig = {
    name: "M.Card",
    description:
        "Share X anywhere, any format. A Chrome extension for easy access to X posts in multiple formats.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:1947",
    keywords: [
        "X.com",
        "Twitter",
        "Chrome Extension",
        "Social Media",
        "Content Sharing",
        "Card Generator",
        "Export Tools",
        "JSON",
        "Markdown",
        "PNG",
        "JPEG",
        "SVG",
    ],
    authors: [{ name: "wlzh", url: "https://github.com/wlzh" }],
    creator: 'wlzh',
    themeColor: '#fff',
    links: {
        github: "https://github.com/wlzh/m-card",
    },
}

export const siteConfig = {
    ...baseSiteConfig,
    openGraph: {
        type: "website",
        locale: "en_US",
        url: baseSiteConfig.url,
        title: baseSiteConfig.name,
        description: baseSiteConfig.description,
        siteName: baseSiteConfig.name,
    },
    twitter: {
        card: "summary_large_image",
        title: baseSiteConfig.name,
        description: baseSiteConfig.description,
        creator: baseSiteConfig.creator,
    },
}
