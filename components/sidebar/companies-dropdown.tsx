"use client";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
} from "@heroui/react";
import React, { useState } from "react";
import Image from "next/image";

interface Company {
  name: string;
  location: string;
  logo: React.ReactNode;
}

export const CompaniesDropdown = () => {
  const [company] = useState<Company>({
    name: "True Soul Partners", // Added newline between True Soul and Partners
    location: "Fort Worth, TX",
    logo: (
      <Image 
        src="/true-soul-partners-icon.png" 
        alt="True Soul Partners Icon" 
        width={40} 
        height={40}
      />
    ),
  });
  
  return (
    <Dropdown
      classNames={{
        base: "w-full min-w-[260px]",
      }}
    >
      <DropdownTrigger className="cursor-pointer">
        <div className="flex items-center gap-2">
          {company.logo}
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-medium m-0 text-default-900 leading-tight">
              True Soul Partners
            </h3>
            <span className="text-xs font-medium text-default-500 mt-1">
              {company.location}
            </span>
          </div>
        </div>
      </DropdownTrigger>
      <DropdownMenu aria-label="Avatar Actions">
        <DropdownSection title="Company">
          <DropdownItem
            key="1"
            startContent={
              <Image 
                src="/true-soul-partners-icon.png" 
                alt="True Soul Partners Icon" 
                width={64} 
                height={64}
              />
            }
            description="Fort Worth, TX"
            classNames={{
              base: "py-4",
              title: "text-base font-semibold",
            }}
          >
            <div>
              <div>True Soul</div>
              <div>Partners</div>
            </div>
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
};
