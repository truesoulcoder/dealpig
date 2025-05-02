import React from 'react';
import { Tooltip, Divider, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { ColorPicker } from './color-picker';
import { FontSizeSelector } from './font-size-selector';
import { FontFamilySelector } from './font-family-selector';
import { ImageUploader } from './image-uploader';
import { useQuillEditor } from '../hooks/use-quill-editor';

export const TextEditor: React.FC = () => {
  const { editorRef, toolbarRef } = useQuillEditor();

  return (
    <div className="flex flex-col w-full">
      {/* Toolbar */}
      <div 
        ref={toolbarRef} 
        className="flex flex-wrap items-center gap-1 p-2 bg-white border-b border-gray-200"
      >
        {/* Font Family */}
        <FontFamilySelector />
        
        {/* Font Size */}
        <FontSizeSelector />
        
        <Divider orientation="vertical" className="h-8 mx-1" />
        
        {/* Text Formatting */}
        <div className="flex items-center gap-1">
          <Tooltip content="Bold" placement="bottom">
            <Button 
              isIconOnly 
              variant="light" 
              size="sm" 
              className="ql-bold"
              aria-label="Bold"
            >
              <Icon icon="lucide:bold" width={18} />
            </Button>
          </Tooltip>
          
          <Tooltip content="Italic" placement="bottom">
            <Button 
              isIconOnly 
              variant="light" 
              size="sm" 
              className="ql-italic"
              aria-label="Italic"
            >
              <Icon icon="lucide:italic" width={18} />
            </Button>
          </Tooltip>
          
          <Tooltip content="Underline" placement="bottom">
            <Button 
              isIconOnly 
              variant="light" 
              size="sm" 
              className="ql-underline"
              aria-label="Underline"
            >
              <Icon icon="lucide:underline" width={18} />
            </Button>
          </Tooltip>
          
          <Tooltip content="Strikethrough" placement="bottom">
            <Button 
              isIconOnly 
              variant="light" 
              size="sm" 
              className="ql-strike"
              aria-label="Strikethrough"
            >
              <Icon icon="lucide:strikethrough" width={18} />
            </Button>
          </Tooltip>
        </div>
        
        <Divider orientation="vertical" className="h-8 mx-1" />
        
        {/* Text Color */}
        <ColorPicker type="color" tooltip="Text Color" />
        
        {/* Background Color */}
        <ColorPicker type="background" tooltip="Background Color" />
        
        <Divider orientation="vertical" className="h-8 mx-1" />
        
        {/* Alignment */}
        <div className="flex items-center gap-1">
          <Tooltip content="Align Left" placement="bottom">
            <Button 
              isIconOnly 
              variant="light" 
              size="sm" 
              className="ql-align" 
              value=""
              aria-label="Align Left"
            >
              <Icon icon="lucide:align-left" width={18} />
            </Button>
          </Tooltip>
          
          <Tooltip content="Align Center" placement="bottom">
            <Button 
              isIconOnly 
              variant="light" 
              size="sm" 
              className="ql-align" 
              value="center"
              aria-label="Align Center"
            >
              <Icon icon="lucide:align-center" width={18} />
            </Button>
          </Tooltip>
          
          <Tooltip content="Align Right" placement="bottom">
            <Button 
              isIconOnly 
              variant="light" 
              size="sm" 
              className="ql-align" 
              value="right"
              aria-label="Align Right"
            >
              <Icon icon="lucide:align-right" width={18} />
            </Button>
          </Tooltip>
          
          <Tooltip content="Justify" placement="bottom">
            <Button 
              isIconOnly 
              variant="light" 
              size="sm" 
              className="ql-align" 
              value="justify"
              aria-label="Justify"
            >
              <Icon icon="lucide:align-justify" width={18} />
            </Button>
          </Tooltip>
        </div>
        
        <Divider orientation="vertical" className="h-8 mx-1" />
        
        {/* Lists */}
        <div className="flex items-center gap-1">
          <Tooltip content="Bullet List" placement="bottom">
            <Button 
              isIconOnly 
              variant="light" 
              size="sm" 
              className="ql-list" 
              value="bullet"
              aria-label="Bullet List"
            >
              <Icon icon="lucide:list" width={18} />
            </Button>
          </Tooltip>
          
          <Tooltip content="Numbered List" placement="bottom">
            <Button 
              isIconOnly 
              variant="light" 
              size="sm" 
              className="ql-list" 
              value="ordered"
              aria-label="Numbered List"
            >
              <Icon icon="lucide:list-ordered" width={18} />
            </Button>
          </Tooltip>
          
          <Tooltip content="Decrease Indent" placement="bottom">
            <Button 
              isIconOnly 
              variant="light" 
              size="sm" 
              className="ql-indent" 
              value="-1"
              aria-label="Decrease Indent"
            >
              <Icon icon="lucide:indent-decrease" width={18} />
            </Button>
          </Tooltip>
          
          <Tooltip content="Increase Indent" placement="bottom">
            <Button 
              isIconOnly 
              variant="light" 
              size="sm" 
              className="ql-indent" 
              value="+1"
              aria-label="Increase Indent"
            >
              <Icon icon="lucide:indent-increase" width={18} />
            </Button>
          </Tooltip>
        </div>
        
        <Divider orientation="vertical" className="h-8 mx-1" />
        
        {/* Insert */}
        <div className="flex items-center gap-1">
          <Tooltip content="Insert Link" placement="bottom">
            <Button 
              isIconOnly 
              variant="light" 
              size="sm" 
              className="ql-link"
              aria-label="Insert Link"
            >
              <Icon icon="lucide:link" width={18} />
            </Button>
          </Tooltip>
          
          <ImageUploader />
          
          <Tooltip content="Insert Code Block" placement="bottom">
            <Button 
              isIconOnly 
              variant="light" 
              size="sm" 
              className="ql-code-block"
              aria-label="Insert Code Block"
            >
              <Icon icon="lucide:code" width={18} />
            </Button>
          </Tooltip>
          
          <Tooltip content="Insert Blockquote" placement="bottom">
            <Button 
              isIconOnly 
              variant="light" 
              size="sm" 
              className="ql-blockquote"
              aria-label="Insert Blockquote"
            >
              <Icon icon="lucide:quote" width={18} />
            </Button>
          </Tooltip>
        </div>
        
        <Divider orientation="vertical" className="h-8 mx-1" />
        
        {/* Headers */}
        <Dropdown>
          <DropdownTrigger>
            <Button 
              variant="light" 
              size="sm" 
              endContent={<Icon icon="lucide:chevron-down" width={16} />}
              aria-label="Heading Format"
            >
              Heading
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Heading formats">
            <DropdownItem key="normal" className="ql-header" value="">Normal</DropdownItem>
            <DropdownItem key="h1" className="ql-header" value="1">Heading 1</DropdownItem>
            <DropdownItem key="h2" className="ql-header" value="2">Heading 2</DropdownItem>
            <DropdownItem key="h3" className="ql-header" value="3">Heading 3</DropdownItem>
            <DropdownItem key="h4" className="ql-header" value="4">Heading 4</DropdownItem>
            <DropdownItem key="h5" className="ql-header" value="5">Heading 5</DropdownItem>
            <DropdownItem key="h6" className="ql-header" value="6">Heading 6</DropdownItem>
          </DropdownMenu>
        </Dropdown>
        
        <Divider orientation="vertical" className="h-8 mx-1" />
        
        {/* Clear Formatting */}
        <Tooltip content="Clear Formatting" placement="bottom">
          <Button 
            isIconOnly 
            variant="light" 
            size="sm" 
            className="ql-clean"
            aria-label="Clear Formatting"
          >
            <Icon icon="lucide:eraser" width={18} />
          </Button>
        </Tooltip>
      </div>
      
      {/* Editor */}
      <div 
        ref={editorRef} 
        className="min-h-[500px] p-4 focus:outline-none"
      />
    </div>
  );
};