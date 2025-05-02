import React from 'react';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import { Icon } from "@iconify/react";

export const FontSizeSelector: React.FC = () => {
  const fontSizes = [
    { value: '8px', label: '8' },
    { value: '9px', label: '9' },
    { value: '10px', label: '10' },
    { value: '11px', label: '11' },
    { value: '12px', label: '12' },
    { value: '14px', label: '14' },
    { value: '16px', label: '16' },
    { value: '18px', label: '18' },
    { value: '20px', label: '20' },
    { value: '22px', label: '22' },
    { value: '24px', label: '24' },
    { value: '26px', label: '26' },
    { value: '28px', label: '28' },
    { value: '36px', label: '36' },
    { value: '48px', label: '48' },
    { value: '72px', label: '72' },
  ];

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button 
          variant="light" 
          size="sm" 
          endContent={<Icon icon="lucide:chevron-down" width={16} />}
          className="min-w-[80px]"
          aria-label="Font Size"
        >
          Font Size
        </Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Font sizes">
        {fontSizes.map((size) => (
          <DropdownItem 
            key={size.value} 
            className="ql-size" 
            value={size.value}
          >
            {size.label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
};