import { AuthLayoutWrapper } from "@/components/auth/authLayout";
import "@/styles/globals.css";
import "@/styles/heroui.css";
import "@/styles/leet.css";
import { Providers } from "../providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AuthLayoutWrapper>{children}</AuthLayoutWrapper>
    </Providers>
  );
}
