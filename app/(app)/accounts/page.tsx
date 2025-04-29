import { Suspense } from "react";
import { Accounts } from "@/components/accounts";

export const metadata = {
  title: "Email Senders | DealPig",
  description: "Manage email sender accounts for your campaigns",
};

export default function SendersPage({ searchParams }: { searchParams?: { error?: string } }) {
  return (
    <>
      {searchParams?.error && (
        <div className="bg-red-100 text-red-800 px-4 py-2 mb-4 rounded">
          {searchParams.error}
        </div>
      )}
      <Suspense fallback={<div className="flex text-green-400 font-mono justify-center p-8">Loading...</div>}>
        <Accounts />
      </Suspense>
    </>
  );
}