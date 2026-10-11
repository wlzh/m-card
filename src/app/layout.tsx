import { Toaster } from "@/components/ui/sonner"
import Logo from '@assets/icon.png'
import './globals.css'
import { siteConfig } from "@src/config/site";

export const metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.name,
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: siteConfig.authors,
  creator: siteConfig.creator,
  openGraph: siteConfig.openGraph,
  twitter: siteConfig.twitter,
};

export const viewport = {
  themeColor: siteConfig.themeColor,
};




export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {


  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link rel="icon" href={Logo.src} />
      </head>
      <body>
        {children}
        <Toaster
          richColors
          position="top-center"
          duration={2000}
        />
      </body>
    </html>
  )
}
