import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/lib/session";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/** UI, forms and body copy — legible at small sizes. */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Display face for headings and the wordmark. A high-contrast transitional
 * serif is what gives the page its hotel-brochure register; pairing it with
 * Inter keeps prices, forms and dense card copy readable, which a serif at
 * 13px would not be.
 */
const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MeDan — Student hostels in Ghana",
  description:
    "Find and book a bed in student hostels near your campus. Payment is held in escrow until you check in.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-ink-900">
        <SessionProvider>
          {/* On the home page the header is absolutely positioned over the
              dark hero, so it must not take part in this flex column. */}
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </SessionProvider>
      </body>
    </html>
  );
}
