import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
const geistSans=Geist({variable:"--font-geist-sans",subsets:["latin"]}); const geistMono=Geist_Mono({variable:"--font-geist-mono",subsets:["latin"]});
export const metadata:Metadata={title:{default:"Bridge Assets | Better real-estate decisions",template:"%s | Bridge Assets"},description:"Curated residential homes, commercial opportunities, and upcoming projects across Delhi NCR.",metadataBase:new URL("https://bridgeassets.in"),openGraph:{title:"Bridge Assets",description:"Premium spaces, clear guidance, local insight."}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>}
