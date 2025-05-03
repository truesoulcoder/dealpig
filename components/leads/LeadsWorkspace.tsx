import React from "react";
import FileExplorer from "./FileExplorer";
import ConsoleLog from "./ConsoleLog";
import DynamicLeadsTable from "./DynamicLeadsTable";
import styles from "../ui/matrix-glass.module.scss";

interface LeadsWorkspaceProps {
  tables: string[];
  selectedTable: string;
  onTableSelect: (t: string) => void;
  leads: any[];
  onLeadEdit: (lead: any) => void;
  onRefresh: () => void;
  onSave: () => void;
  messages: Array<{
    type: 'info' | 'error' | 'success';
    message: string;
    timestamp?: number;
  }>;
}

export default function LeadsWorkspace({
  tables,
  selectedTable,
  onTableSelect,
  leads,
  onLeadEdit,
  onRefresh,
  onSave,
}: LeadsWorkspaceProps) {
  return (
    <div className="flex flex-col md:flex-row gap-8 w-full p-6">
      {/* File Explorer */}
      <div className={`${styles["matrix-glass"]} w-full md:w-1/4 min-w-[260px] max-w-xs shadow-lg`}>
        <div className={styles["matrix-glass-header"]}>Files</div>
        <div className={styles["matrix-glass-content"]}>
          <FileExplorer />
        </div>
      </div>
      {/* Main Workspace: Table + Console */}
      <div className="flex flex-col gap-8 flex-1">
        {/* Table Section */}
        <div className={`${styles["matrix-glass"]} w-full shadow-lg`}>
          <div className={styles["matrix-glass-header"]}>
            Leads Table
            <select
              className="ml-4 bg-black/60 border border-green-500 text-green-300 rounded px-2 py-1 font-mono"
              value={selectedTable}
              onChange={e => onTableSelect(e.target.value)}
              disabled={tables.length === 0}
            >
              {tables.length === 0 && <option>No tables</option>}
              {tables.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className={styles["matrix-glass-content"]}>
            {tables.length === 0 ? (
              <div className="text-center text-gray-400 py-12 text-lg">No lead tables available.<br/>Please upload leads to get started.</div>
            ) : (
              <DynamicLeadsTable 
                table={selectedTable} 
                leads={leads} 
                onEdit={onLeadEdit} 
                onRefresh={onRefresh}
                onSave={onSave}
              />
            )}
          </div>
        </div>
        {/* Console Log Section */}
        <div className={`${styles["matrix-glass"]} w-full shadow-lg`}>
          <div className={styles["matrix-glass-header"]}>Console Log</div>
          <div className={styles["matrix-glass-content"]}>
            <ConsoleLog messages={messages} />
          </div>
        </div>
      </div>
    </div>
  );
}
