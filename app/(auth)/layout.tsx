import { AuthLayoutWrapper } from "@/components/auth/authLayout";
import { Suspense } from "react";
import { AuthLoadingSkeleton } from "@/components/ui/AuthLoadingSkeleton";
import "@/styles/globals.css";
import "@/styles/heroui.css";
import "@/styles/leet.css";
import { Providers } from "../providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AuthLayoutWrapper>
        <Suspense fallback={<AuthLoadingSkeleton />}>
          {children}
        </Suspense>
      </AuthLayoutWrapper>
    </Providers>
  );
}
