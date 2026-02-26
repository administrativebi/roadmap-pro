import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/query-provider";
import { PWAProvider } from "@/components/providers/pwa-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { A11yProvider } from "@/components/providers/a11y-provider";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { FocusModeProvider } from "@/components/providers/focus-mode-provider";
import themeConfig from "@/theme.json";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Checklist Pro — Gamificado",
  description: "PWA gamificado para checklists inteligentes em restaurantes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Checklist Pro",
  },
};

export const viewport: Viewport = {
  themeColor: "#18181b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeStyles = {
    "--primary-color": themeConfig.colors.primary,
    "--accent-color": themeConfig.colors.accent,
    "--bg-color": themeConfig.colors.background,
    "--surface-color": themeConfig.colors.surface,
    "--text-color": themeConfig.colors.text,
  } as React.CSSProperties;

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} style={themeStyles}>
        {/* Skip navigation for screen readers (A11y) */}
        <a href="#main-content" className="sr-skip-link">
          Pular para o conteúdo principal
        </a>
        <QueryProvider>
          <ThemeProvider>
            <A11yProvider>
              <I18nProvider>
                <FocusModeProvider>
                  <PWAProvider>
                    <div id="main-content">
                      {children}
                    </div>
                  </PWAProvider>
                </FocusModeProvider>
              </I18nProvider>
            </A11yProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
