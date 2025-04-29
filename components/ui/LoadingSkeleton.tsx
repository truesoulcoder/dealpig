"use client";

import { Card, Skeleton } from "@heroui/react";

export function LoadingSkeleton() {
  return (
    <div className="w-full space-y-6 p-6">
      {/* Header section */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>

      {/* Main content section */}
      <div className="space-y-6">
        {/* Content blocks */}
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4 space-y-4">
            <Skeleton className="h-6 w-full" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </Card>
        ))}

        {/* Table-like structure */}
        <Card className="p-4">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
} 