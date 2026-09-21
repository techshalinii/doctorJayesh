import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FloatingWhatsApp } from "@/components/layout/floating-whatsapp";
import { ScrollProgress } from "@/components/layout/scroll-progress";
import { SiteChrome } from "@/components/layout/site-chrome";
import { SmoothScroll } from "@/components/ui/smooth-scroll";
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
        {/* `forcedTheme` because the dark-mode switch has been removed from the navbar.
            Without it `enableSystem` would still flip the whole site to dark for anyone
            whose OS is set to dark, and a visitor who had toggled dark before would stay
            dark forever via next-themes' localStorage entry — in both cases with no
            control left to get back. Forcing light ignores both and pins the one theme
            the site now ships. The provider itself stays so the `dark:` variants
            throughout the components remain valid and this is a one-line revert. */}
        <ThemeProvider attribute="class" forcedTheme="light" disableTransitionOnChange>
          {/* Lenis, wired to GSAP's ticker. It renders no wrapper element and drives the
              real window scroll, so the fixed navbar, progress bar, WhatsApp button and
              gallery lightbox all keep working. Disabled under prefers-reduced-motion. */}
          <SmoothScroll>
          {/* <SiteChrome> renders the public shell everywhere EXCEPT /admin, which is a
              dashboard and has no business carrying a patient-facing navbar, footer or
              WhatsApp button. Public routes are unaffected — see components/layout/site-chrome.tsx. */}
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
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
