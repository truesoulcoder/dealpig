import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Accounts } from "@/components/accounts";

export const metadata = {
  title: "Email Senders | DealPig",
  description: "Manage email sender accounts for your campaigns",
};

export default async function SendersPage({ searchParams }: { searchParams: Promise<{ error?: string | string[] }> }) {
  const { error: rawError } = await searchParams;
  const error = Array.isArray(rawError) ? rawError[0] : rawError;
  return (
    <>
      {error && (
        <div className="bg-red-100 text-red-800 px-4 py-2 mb-4 rounded">
          {error}
        </div>
      )}
      <Suspense fallback={<div className="flex text-green-400 font-mono justify-center p-8">Loading...</div>}>
        <Accounts />
      </Suspense>
    </>
  );
}