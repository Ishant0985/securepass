import {
  ClerkProvider
} from '@clerk/nextjs'
import './globals.css'
import FirebaseAuthProvider from "@/components/FirebaseAuthProvider" // adjust the path if needed
import Navbar from '@/components/Navbar'
import { ThemeProvider } from "@/components/theme-provider"
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Navbar/>
            <FirebaseAuthProvider>
            {children}
            </FirebaseAuthProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
