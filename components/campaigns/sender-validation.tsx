"use client";

import React, { useState } from "react";
import { Button } from "@heroui/react";
import { validateSender } from "../../actions/validateSender.action";
import { toast } from "../ui/toast";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface SenderValidationProps {
  campaignId: string;
  senderIds: string[];
  userId: string;
  userEmail: string;
}

export default function SenderValidation({
  campaignId,
  senderIds,
  userId,
  userEmail,
}: SenderValidationProps) {
  const [validationStatus, setValidationStatus] = useState<{
    [key: string]: "idle" | "loading" | "success" | "error";
  }>({});
  
  const [errorMessages, setErrorMessages] = useState<{
    [key: string]: string;
  }>({});

  const handleValidateSender = async (senderId: string) => {
    try {
      // Update status to loading
      setValidationStatus((prev) => ({
        ...prev,
        [senderId]: "loading",
      }));

      // Call the server action to validate the sender
      const result = await validateSender(campaignId, senderId, userId, userEmail);

      if (result.success) {
        // Update status to success
        setValidationStatus((prev) => ({
          ...prev,
          [senderId]: "success",
        }));
        
        toast.default({
          title: "Sender validation email sent",
          description: `A test email has been sent to ${userEmail}. Please check your inbox.`
        });
      } else {
        // Update status to error
        setValidationStatus((prev) => ({
          ...prev,
          [senderId]: "error",
        }));
        
        // Store error message
        setErrorMessages((prev) => ({
          ...prev,
          [senderId]: result.message,
        }));
        
        toast.destructive({
          title: "Sender validation failed",
          description: result.message
        });
      }
    } catch (error) {
      console.error("Error during sender validation:", error);
      
      // Update status to error
      setValidationStatus((prev) => ({
        ...prev,
        [senderId]: "error",
      }));
      
      // Store error message
      setErrorMessages((prev) => ({
        ...prev,
        [senderId]: error instanceof Error ? error.message : "Unknown error occurred",
      }));
      
      toast.destructive({
        title: "Sender validation failed",
        description: "An unexpected error occurred during validation"
      });
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
        <h3 className="text-lg font-semibold mb-2">Sender Validation</h3>
        <p className="text-sm text-slate-600 mb-4">
          Verify each sender&apos;s configuration by sending a test email that matches 
          your campaign&apos;s template format, including any document attachments.
          This will help ensure your emails will be delivered correctly when the campaign launches.
        </p>
        
        <div className="space-y-3">
          {senderIds.length === 0 ? (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
              No senders have been assigned to this campaign. Please add at least one sender.
            </div>
          ) : (
            senderIds.map((senderId) => (
              <div 
                key={senderId} 
                className="flex items-center justify-between bg-white p-3 rounded-md border border-slate-100"
              >
                <div>
                  <span className="text-sm font-medium">Sender ID: {senderId}</span>
                  
                  {validationStatus[senderId] === "error" && (
                    <div className="mt-1 text-xs text-red-600">
                      {errorMessages[senderId]}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {validationStatus[senderId] === "success" && (
                    <span className="flex items-center text-xs text-green-600">
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Validated
                    </span>
                  )}
                  
                  <Button 
                    size="sm"
                    variant={validationStatus[senderId] === "error" ? "bordered" : "light"}
                    color={validationStatus[senderId] === "error" ? "danger" : "default"}
                    onClick={() => handleValidateSender(senderId)}
                    disabled={validationStatus[senderId] === "loading"}
                  >
                    {validationStatus[senderId] === "loading" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : validationStatus[senderId] === "success" ? (
                      "Validate Again"
                    ) : validationStatus[senderId] === "error" ? (
                      <>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Retry
                      </>
                    ) : (
                      "Send Test Email"
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-4 text-xs text-slate-500">
          <p>
            Test emails will be sent to: <strong>{userEmail}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}