"use client";

import { Select } from "@heroui/react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LeadSource } from "@/helpers/types";

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
  const supabase = createClient();

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

  const handleSelect = (selectedId: string) => {
    if (!onSelect) return;
    
    const selectedSource = leadSources.find(source => source.id === selectedId);
    if (selectedSource) {
      onSelect(selectedSource.id, selectedSource.storage_path);
    }
  };

  const options = leadSources.map(source => ({
    label: source.name,
    value: source.id,
  }));

  return (
    <Select
      options={options}
      value={value}
      onSelect={handleSelect}
      className={className}
      style={style}
      emptyState={isLoading ? "Loading..." : "No lead sources found"}
      searchable
    />
  );
} 