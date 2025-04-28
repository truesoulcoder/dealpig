import { Suspense } from "react";
import { Accounts } from "@/components/accounts";

export const metadata = {
  title: "Email Senders | DealPig",
  description: "Manage email sender accounts for your campaigns",
};

export default function SendersPage() {
  return (
    <Suspense fallback={<div className="flex text-green-400 font-mono justify-center p-8">Loading...</div>}>
      <Accounts />
    </Suspense>
  );
}