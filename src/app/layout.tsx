import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VyingCloud Email Builder",
  description: "Production email builder with AEM integration, Brand Kit, and A/B testing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
