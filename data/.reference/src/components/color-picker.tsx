import React from 'react';
import { Popover, PopoverTrigger, PopoverContent, Button, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";

interface ColorPickerProps {
  type: 'color' | 'background';
  tooltip: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ type, tooltip }) => {
  const colors = [
    '#000000', '#e60000', '#ff9900', '#ffff00', '#008a00', 
    '#0066cc', '#9933ff', '#ffffff', '#facccc', '#ffebcc', 
    '#ffffcc', '#cce8cc', '#cce0f5', '#ebd6ff', '#bbbbbb', 
    '#f06666', '#ffc266', '#ffff66', '#66b966', '#66a3e0', 
    '#c285ff', '#888888', '#a10000', '#b26b00', '#b2b200', 
    '#006100', '#0047b2', '#6b24b2', '#444444', '#5c0000', 
    '#663d00', '#666600', '#003700', '#002966', '#3d1466'
  ];

  const iconName = type === 'color' ? 'lucide:type' : 'lucide:highlighter';
  const className = type === 'color' ? 'ql-color' : 'ql-background';

  return (
    <Popover placement="bottom">
      <Tooltip content={tooltip} placement="bottom">
        <PopoverTrigger>
          <Button 
            isIconOnly 
            variant="light" 
            size="sm"
            aria-label={tooltip}
          >
            <Icon icon={iconName} width={18} />
          </Button>
        </PopoverTrigger>
      </Tooltip>
      <PopoverContent className="p-2 w-[232px]">
        <div className="grid grid-cols-9 gap-1">
          {colors.map((color, index) => (
            <button
              key={index}
              type="button"
              className={`${className} w-6 h-6 rounded cursor-pointer border border-gray-200 hover:scale-110 transition-transform`}
              style={{ backgroundColor: color }}
              value={color}
              aria-label={`Color ${color}`}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};