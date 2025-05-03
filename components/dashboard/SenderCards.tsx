import React from "react";
import { Card, CardHeader, CardBody, Progress } from "@heroui/react";

export type SenderStats = {
  id: string;
  name: string;
  email: string;
  sent: number;
  delivered: number;
  bounced: number;
  quota: number;
};

export const SenderCards: React.FC<{ senders: SenderStats[] }> = ({ senders }) => {
  return (
    <div className="flex flex-wrap gap-4">
      {senders.map(sender => (
        <Card key={sender.id} className="min-w-[220px] max-w-xs bg-opacity-80">
          <CardHeader className="flex flex-col items-start">
            <span className="font-bold text-lg">{sender.name}</span>
            <span className="text-xs text-gray-400">{sender.email}</span>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-xs"><span>Sent</span><span>{sender.sent}</span></div>
              <div className="flex justify-between text-xs"><span>Delivered</span><span>{sender.delivered}</span></div>
              <div className="flex justify-between text-xs"><span>Bounced</span><span>{sender.bounced}</span></div>
              <div className="flex justify-between text-xs"><span>Quota</span><span>{sender.quota}</span></div>
              <Progress value={Math.round((sender.sent / sender.quota) * 100)} color="success" className="mt-2" />
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};

export default SenderCards;
