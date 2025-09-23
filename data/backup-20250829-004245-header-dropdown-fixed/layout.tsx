import AppHeader from "@/components/ui/AppHeader";
import SideNav from "@/components/ui/SideNav";
import { SonnerToaster } from "@/components/ui/Toast";
import React from "react";
import ClientLayoutWrapper from "./ClientLayoutWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ClientLayoutWrapper>
        {children}
      </ClientLayoutWrapper>
      <SonnerToaster />
    </>
  );
}
