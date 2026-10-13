import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import AppShell from "@/components/AppShell";
import ThemeRegistry from "@/components/ThemeRegistry";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Food parcel coordinator",
  description: "Monthly school feeding orders, supplier prices, and deliveries for KwaZulu-Natal public schools.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plex.variable}>
      <body>
        <ThemeRegistry>
          <StoreProvider>
            <AppShell>{children}</AppShell>
          </StoreProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
