import React, { Suspense } from "react";
import { Accounts } from "@/components/accounts";

const AccountsPage = () => {
  return (
    <Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
      <Accounts />
    </Suspense>
  );
};

export default AccountsPage;
