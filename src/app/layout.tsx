import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import ReactQueryProvider from "@/providers/react-query-providers";
import { Toaster } from "@/components/ui/sonner";
import { esES } from "@clerk/localizations";

const raleway = Raleway({
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: "KarolAI",
  description: "KarolAI Automatiza tu comunicación al cliente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={esES as any}>
      <html lang="es" suppressHydrationWarning>
        <body className={`${raleway.className} antialiased notranslate`}>
          <ThemeProvider>
            <main>
              <ReactQueryProvider>{children}</ReactQueryProvider>
            </main>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
