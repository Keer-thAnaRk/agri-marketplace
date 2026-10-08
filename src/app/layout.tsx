import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { MarketplaceProvider } from "@/context/MarketplaceContext";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { LocationModal } from "@/components/common/LocationModal";
import { GlobalSearchModal } from "@/components/common/GlobalSearchModal";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { RoleSwitcher } from "@/components/ui/RoleSwitcher";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Krishi Market – Fresh from local farms. Direct to your doorstep.",
  description:
    "A digital marketplace connecting verified local farmers directly with consumers. 100% traceable, dawn-harvested fresh produce delivered across Bengaluru.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FBF9F5] text-slate-900 selection:bg-forest-200 selection:text-forest-900">
        <AuthProvider>
          <MarketplaceProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <LocationModal />
            <GlobalSearchModal />
            <ToastContainer />
            <RoleSwitcher />
          </MarketplaceProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

