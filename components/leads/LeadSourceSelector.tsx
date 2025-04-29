"use client";

import { useEffect, useState } from "react";
import { Select, SelectItem, Skeleton } from "@heroui/react";
import { supabase } from "@/lib/supabase";
import type { LeadSource } from "@/helpers/types";
import type { Selection } from "@heroui/react";

interface LeadSourceSelectorProps {
  value?: string;
  onSelect?: (sourceId: string, storagePath: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}

export default function LeadSourceSelector({
  value,
  onSelect,
  className,
  style,
  placeholder = "Select a lead source",
}: LeadSourceSelectorProps) {
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeadSources() {
      try {
        const { data, error } = await supabase
          .from("lead_sources")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching lead sources:", error);
          return;
        }

        setLeadSources(data || []);
      } catch (error) {
        console.error("Error fetching lead sources:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeadSources();
  }, []);

  const handleSelectionChange = (keys: Selection) => {
    if (!onSelect) return;
    
    const selectedId = Array.from(keys)[0] as string;
    const selectedSource = leadSources.find(source => source.id === selectedId);
    if (selectedSource) {
      onSelect(selectedSource.id, selectedSource.storage_path);
    }
  };

  if (isLoading) {
    return (
      <div className={className} style={style}>
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <Select
      label="Lead Source"
      placeholder={placeholder}
      selectedKeys={value ? [value] : []}
      className={className}
      style={style}
      onSelectionChange={handleSelectionChange}
    >
      {leadSources.map((source) => (
        <SelectItem key={source.id}>
          {source.name || source.file_name.split('.')[0]}
        </SelectItem>
      ))}
    </Select>
  );
} 