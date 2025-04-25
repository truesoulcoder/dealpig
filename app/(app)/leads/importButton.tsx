'use client';

import { Button } from "@heroui/react";
import { FaPlus } from "react-icons/fa6";
import { useRouter } from "next/navigation";

export default function ImportButton() {
  const router = useRouter();
  
  return (
    <Button 
      color="primary" 
      startContent={<FaPlus />}
      onPress={() => router.push('/leads/import')}
    >
      Import Leads
    </Button>
  );
}