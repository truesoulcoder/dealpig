import React from 'react';
import { Button, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";

export const ImageUploader: React.FC = () => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <>
      <Tooltip content="Insert Image" placement="bottom">
        <Button 
          isIconOnly 
          variant="light" 
          size="sm"
          onPress={handleButtonClick}
          aria-label="Insert Image"
        >
          <Icon icon="lucide:image" width={18} />
        </Button>
      </Tooltip>
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const range = document.getSelection();
              if (range && typeof range.getRangeAt === 'function') {
                const quill = (window as any).quillInstance;
                if (quill) {
                  const index = quill.getSelection()?.index || 0;
                  quill.insertEmbed(index, 'image', e.target?.result);
                }
              }
            };
            reader.readAsDataURL(file);
          }
        }}
      />
    </>
  );
};