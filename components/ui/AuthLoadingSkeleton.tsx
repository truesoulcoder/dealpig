"use client";

import { Card, Skeleton } from "@heroui/react";

export function AuthLoadingSkeleton() {
  return (
    <Card className="max-w-md mx-auto p-6 space-y-8">
      {/* Logo/Header */}
      <div className="flex justify-center">
        <Skeleton className="h-12 w-32" />
      </div>

      {/* Form fields */}
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        
        {/* Button */}
        <Skeleton className="h-10 w-full" />
        
        {/* Links */}
        <div className="space-y-3 pt-4">
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
      </div>
    </Card>
  );
} 