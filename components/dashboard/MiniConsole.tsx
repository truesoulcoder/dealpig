import React from "react";

export type ConsoleMessage = {
  worker: string;
  message: string;
  timestamp: number;
  type?: "info" | "success" | "error";
};

export const MiniConsole: React.FC<{ messages: ConsoleMessage[] }> = ({ messages }) => {
  return (
    <div className="bg-black/80 rounded-md p-2 h-56 overflow-y-auto font-mono text-xs border border-green-500 shadow-inner">
      {messages.length === 0 && <div className="text-gray-500">No activity yet.</div>}
      {messages.map((msg, i) => (
        <div key={i} className={`mb-1 flex items-start gap-2 ${msg.type === "error" ? "text-red-400" : msg.type === "success" ? "text-green-400" : "text-green-200"}`}>
          <span className="font-bold">[{msg.worker}]</span>
          <span>{msg.message}</span>
          <span className="ml-auto text-gray-500">{new Date(msg.timestamp).toISOString().slice(11, 19)}</span>
        </div>
      ))}
    </div>
  );
};

export default MiniConsole;
