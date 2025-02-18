import {
  ClerkProvider
} from '@clerk/nextjs'
import './globals.css'
import FirebaseAuthProvider from "@/components/FirebaseAuthProvider" // adjust the path if needed
import Navbar from '@/components/Navbar'
import { ThemeProvider } from "@/components/theme-provider"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
        <meta name="google-adsense-account" content="ca-pub-9163676450980454"/>
        <meta name="google-site-verification" content="cAK8SSwBYFev4YHkUZy48fJGnA5_ndWSnnyz3wY69UY" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9163676450980454"
     crossOrigin="anonymous"></script>
          </head>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar/>
            <Analytics/>
            <SpeedInsights/>
            <FirebaseAuthProvider>
            {children}
            </FirebaseAuthProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
