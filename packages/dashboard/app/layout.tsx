import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme/theme-provider";
import QueryProvider from "@/components/react_query/query-provider";
import { DashboardSidebar } from "./components/dashboard-sidebar";
import Header from "./components/header/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Databite",
  description: "Easy Integrations For Developers.",
  openGraph: {
    title: "Open Source Integration Library",
    description: "Easy Integrations For Developers.",
    url: "https://databite.dev/",
    siteName: "Databite",
    images: [
      {
        url: "https://raw.githubusercontent.com/DatabiteDev/databite/main/docs/images/hero.png",
        width: 1200,
        height: 630,
        alt: "Databite Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Databite",
    description: "Easy Integrations For Developers.",
    images: [
      "https://raw.githubusercontent.com/DatabiteDev/databite/main/docs/images/hero.png",
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class">
          <QueryProvider>
            <div className="flex h-screen w-screen flex-row overflow-x-hidden overflow-y-hidden">
              {<DashboardSidebar />}
              <div className="flex-1 overflow-y-hidden flex flex-col">
                {<Header />}
                <main className="flex-1 overflow-y-hidden">{children}</main>
              </div>
            </div>
          </QueryProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
