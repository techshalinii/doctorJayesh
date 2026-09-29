import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FloatingWhatsApp } from "@/components/layout/floating-whatsapp";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { SiteChrome } from "@/components/layout/site-chrome";
import { doctor, siteUrl } from "@/lib/data";
import { OG_IMAGE } from "@/lib/seo";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${doctor.name} — ${doctor.title} in Mumbai`,
    template: `%s · ${doctor.name}`,
  },
  description: doctor.intro,
  keywords: [
    "neurosurgeon Mumbai",
    "spine surgeon Mumbai",
    "brain tumor surgery",
    "minimally invasive spine surgery",
    "endoscopic brain surgery",
    "deep brain stimulation",
    doctor.name,
  ],
  authors: [{ name: doctor.name }],
  openGraph: {
    type: "website",
    title: `${doctor.name} — ${doctor.title}`,
    description: doctor.intro,
    url: siteUrl,
    siteName: doctor.name,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${doctor.name} — ${doctor.title}`,
    description: doctor.intro,
    images: [OG_IMAGE.url],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jakarta.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" forcedTheme="light" disableTransitionOnChange>
          <SiteChrome
            chrome={{
              top: (
                <>
                  <ScrollProgress />
                  <a
                    href="#main"
                    className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-white"
                  >
                    Skip to content
                  </a>
                  <Navbar />
                </>
              ),
              bottom: (
                <>
                  <Footer />
                  <FloatingWhatsApp />
                </>
              ),
            }}
          >
            {children}
          </SiteChrome>
        </ThemeProvider>
      </body>
    </html>
  );
}
