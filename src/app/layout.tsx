import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Big B Royale | Welcome to your royal side",
  description: "Your everyday, elevated. Log in or join Big B Royale, your Ghanaian destination for thoughtful finds.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-GH"><body>{children}</body></html>;
}
