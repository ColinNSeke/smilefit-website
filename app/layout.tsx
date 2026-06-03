import type { Metadata } from "next";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMILEFIT — Built Different",
  description:
    "Premium Training. Maschinen, Atmosphäre und Fokus auf einem anderen Level.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#08080a] text-[#f2efe6]">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
