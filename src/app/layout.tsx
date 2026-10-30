import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CommerceProvider } from "@/components/commerce-provider";

export const metadata: Metadata = {
  title: "Big B Royale | Shop and order on WhatsApp",
  description: "Shop personalised gifts, watches and home essentials from Big B Royale in Ghana.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#091A73",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-GH"><body><CommerceProvider>{children}</CommerceProvider></body></html>;
}
