"use client";

import { usePathname } from "next/navigation";

interface ConditionalLayoutProps {
  children: React.ReactNode;
  header: React.ReactNode;
  footer: React.ReactNode;
  chatWidget: React.ReactNode;
}

export default function ConditionalLayout({
  children,
  header,
  footer,
  chatWidget,
}: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      {header}
      {children}
      {chatWidget}
      {footer}
    </>
  );
}
