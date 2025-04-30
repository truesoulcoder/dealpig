import { Layout } from "@/components/layout/layout";
import { Suspense } from "react";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { NavbarSkeleton } from "@/components/ui/NavbarSkeleton";
import "@/styles/globals.css";
import "@/styles/heroui.css";
import "@/styles/leet.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout>
      <Suspense fallback={
        <div className="w-full">
          <NavbarSkeleton />
          <LoadingSkeleton />
        </div>
      }>
        {children}
      </Suspense>
    </Layout>
  );
}
