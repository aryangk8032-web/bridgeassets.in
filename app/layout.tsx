import type { Metadata } from "next";
import "./globals.css";
import {WhatsAppButton} from "./components";
import {ClientRequirementAssistant} from "./client-requirement-assistant";
export const metadata:Metadata={title:{default:"Bridge Assets | Better real-estate decisions",template:"%s | Bridge Assets"},description:"Curated residential homes, commercial opportunities, and upcoming projects across Delhi NCR.",metadataBase:new URL("https://bridgeassets.in"),openGraph:{title:"Bridge Assets",description:"Premium spaces, clear guidance, local insight."}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}<ClientRequirementAssistant/><WhatsAppButton/></body></html>}
