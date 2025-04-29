"use client";

import { Navbar, Skeleton } from "@heroui/react";

export function NavbarSkeleton() {
  return (
    <Navbar>
      <div className="flex w-full items-center justify-between gap-4">
        {/* Brand/Logo area */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-24" />
        </div>

        {/* Center content */}
        <div className="hidden md:flex flex-1 justify-center gap-8">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </Navbar>
  );
} 