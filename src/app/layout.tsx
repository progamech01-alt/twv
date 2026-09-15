import type { Metadata, Viewport } from "next";
import { UniverseProvider } from "@/components/universe-provider";
import { Shell } from "@/components/shell";
import "@fontsource-variable/noto-sans-thai";
import "@fontsource-variable/manrope";
import "./globals.css";
export const metadata: Metadata = {
  title: "TAWANVERSE — Our Little Universe",
  description: "A private space for little moments.",
  robots: { index: false, follow: false },
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon-192.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#061426",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        <a href="#content" className="skip-link">
          ข้ามไปเนื้อหา
        </a>
        <UniverseProvider>
          <Shell>
            <div id="content">{children}</div>
          </Shell>
        </UniverseProvider>
      </body>
    </html>
  );
}
