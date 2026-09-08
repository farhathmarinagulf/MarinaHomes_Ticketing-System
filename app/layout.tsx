import type { Metadata } from "next";
import "./globals.css";
import "./mobile.css";
import "./branding.css";
export const metadata: Metadata = {
  title: "MRC IT Hub",
  description: "Your dedicated Marina Homes staff support portal.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
