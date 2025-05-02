import React from 'react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import { Icon } from "@iconify/react";

export const FontFamilySelector: React.FC = () => {
  const fonts = [
    { value: 'Arial', label: 'Arial' },
    { value: 'Courier New', label: 'Courier New' },
    { value: 'Georgia', label: 'Georgia' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Lucida Sans', label: 'Lucida Sans' },
    { value: 'Tahoma', label: 'Tahoma' },
    { value: 'Times New Roman', label: 'Times New Roman' },
    { value: 'Trebuchet MS', label: 'Trebuchet MS' },
    { value: 'Verdana', label: 'Verdana' },
  ];

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button 
          variant="light" 
          size="sm" 
          endContent={<Icon icon="lucide:chevron-down" width={16} />}
          className="min-w-[120px]"
          aria-label="Font Family"
        >
          Font Family
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Font families">
        {fonts.map((font) => (
          <DropdownItem 
            key={font.value} 
            className="ql-font" 
            value={font.value}
            style={{ fontFamily: font.value }}
          >
            {font.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};