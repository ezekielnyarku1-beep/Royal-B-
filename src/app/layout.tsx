import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Big B Royale | Welcome to your royal side",
  description: "Your everyday, elevated. Log in or join Big B Royale, your Ghanaian destination for thoughtful finds.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#091A73",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-GH"><body>{children}</body></html>;
}
