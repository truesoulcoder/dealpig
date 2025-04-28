import { Layout } from "@/components/layout/layout";
import "@/styles/globals.css";
import "@/styles/heroui.css";
import "@/styles/leet.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
