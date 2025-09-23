import AppHeader from "@/components/ui/AppHeader";
import SideNav from "@/components/ui/SideNav";
import { SonnerToaster } from "@/components/ui/Toast";
import React from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="w-full flex min-h-screen bg-background">
        <SideNav />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <main className="flex-1 p-6 overflow-auto bg-gray-50/30">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
      <SonnerToaster />
    </>
  );
}
