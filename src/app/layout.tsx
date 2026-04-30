import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Codex Video Editor",
  description: "A professional desktop video editor foundation built with Next.js, Tauri, and FFmpeg."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
