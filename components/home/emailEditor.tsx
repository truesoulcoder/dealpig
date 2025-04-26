"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Tooltip, Popover, PopoverTrigger, PopoverContent } from '@heroui/react';
import { useEffect } from 'react';
import { 
  FaBold, FaItalic, FaUnderline, FaAlignLeft, 
  FaAlignCenter, FaAlignRight, FaAlignJustify, 
  FaLink, FaHeading, FaParagraph, FaListUl, FaListOl,
  FaFont, FaPalette
} from 'react-icons/fa';
import { MdFormatColorText, MdFormatSize } from 'react-icons/md';

// Interface for the editor props
interface EmailEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  onEditorReady?: (editor: any) => void;
}

// Color palette for text formatting
const COLORS = [
  '#000000', '#343a40', '#495057', '#868e96', '#adb5bd', 
  '#1971c2', '#4dabf7', '#3b5bdb', '#748ffc', '#f03e3e', 
  '#ff8787', '#d9480f', '#fd7e14', '#e67700', '#fcc419', 
  '#2b8a3e', '#51cf66', '#087f5b', '#20c997', '#6741d9'
];

// Font sizes for formatting
const FONT_SIZES = [
  { label: 'Small', value: '12px' },
  { label: 'Normal', value: '16px' },
  { label: 'Medium', value: '20px' },
  { label: 'Large', value: '24px' },
  { label: 'X-Large', value: '32px' },
];

// Font families
const FONT_FAMILIES = [
  { label: 'Sans-serif', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Serif', value: 'Georgia, Times New Roman, serif' },
  { label: 'Monospace', value: 'Courier New, Courier, monospace' },
  { label: 'Cursive', value: 'Comic Sans MS, cursive' },
];

const EmailEditor = ({ initialContent = '', onChange, placeholder = 'Write your email here...', onEditorReady }: EmailEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Color,
      TextStyle,
      FontFamily,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose max-w-none focus:outline-none p-4 min-h-[300px] text-gray-900',
        placeholder,
      },
    },
    immediatelyRender: false, // Prevent SSR hydration issues
  });

  // Pass the editor instance to parent component when it's ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  if (!editor) {
    return <div className="min-h-[300px] flex items-center justify-center">Loading editor...</div>;
  }

  // Handles link insertion with proper UI
  const handleLinkInsert = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    
    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="email-editor">
      <div className="border-b border-gray-300 p-2 flex flex-wrap gap-1 items-center overflow-x-auto bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
        {/* Headings and Paragraph Dropdown */}
        <Dropdown>
          <DropdownTrigger>
            <Button
              size="sm"
              variant="flat"
              className="px-3 min-w-[80px] justify-between"
            >
              {editor.isActive('heading', { level: 1 }) ? 'H1' :
               editor.isActive('heading', { level: 2 }) ? 'H2' :
               editor.isActive('heading', { level: 3 }) ? 'H3' :
               'Normal'}
              <span className="ml-2">▼</span>
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Text styles">
            <DropdownItem key="paragraph" onPress={() => editor.chain().focus().setParagraph().run()}>
              Normal text
            </DropdownItem>
            <DropdownItem key="heading-1" onPress={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
              Heading 1
            </DropdownItem>
            <DropdownItem key="heading-2" onPress={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              Heading 2
            </DropdownItem>
            <DropdownItem key="heading-3" onPress={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
              Heading 3
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>

        <div className="border-r border-gray-300 h-6 mx-2" />

        {/* Font Family Dropdown */}
        <Dropdown>
          <DropdownTrigger>
            <Button
              size="sm"
              variant="flat"
              className="px-3 gap-1"
              startContent={<FaFont size={14} />}
            >
              Font
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Font families">
            {FONT_FAMILIES.map((font) => (
              <DropdownItem 
                key={font.value}
                onPress={() => editor.chain().focus().setFontFamily(font.value).run()}
                style={{ fontFamily: font.value }}
              >
                {font.label}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>

        {/* Font Size Dropdown */}
        <Dropdown>
          <DropdownTrigger>
            <Button
              size="sm"
              variant="flat"
              className="px-3 gap-1"
              startContent={<MdFormatSize size={16} />}
            >
              Size
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Font sizes">
            {FONT_SIZES.map((size) => (
              <DropdownItem 
                key={size.value}
                onPress={() => editor.chain().focus().setMark('textStyle', { fontSize: size.value }).run()}
              >
                <span style={{ fontSize: size.value }}>{size.label}</span>
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>

        <div className="border-r border-gray-300 h-6 mx-2" />

        {/* Text Color */}
        <Popover placement="bottom">
          <PopoverTrigger>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              className="min-w-8 h-8 relative"
              title="Text Color"
            >
              <MdFormatColorText size={16} />
              <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-blue-500"></span>
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="p-2">
              <div className="grid grid-cols-5 gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded transition-transform hover:scale-110"
                    style={{ backgroundColor: color }}
                    onClick={() => editor.chain().focus().setColor(color).run()}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Format Group */}
        <div className="flex gap-1 mx-2">
          <Tooltip content="Bold" placement="top">
            <Button
              isIconOnly
              size="sm"
              variant={editor.isActive('bold') ? "solid" : "flat"}
              onPress={() => editor.chain().focus().toggleBold().run()}
              className="min-w-8 h-8"
              aria-label="Bold text"
            >
              <FaBold size={14} />
            </Button>
          </Tooltip>
          <Tooltip content="Italic" placement="top">
            <Button
              isIconOnly
              size="sm"
              variant={editor.isActive('italic') ? "solid" : "flat"}
              onPress={() => editor.chain().focus().toggleItalic().run()}
              className="min-w-8 h-8"
              aria-label="Italic text"
            >
              <FaItalic size={14} />
            </Button>
          </Tooltip>
          <Tooltip content="Underline" placement="top">
            <Button
              isIconOnly
              size="sm"
              variant={editor.isActive('underline') ? "solid" : "flat"}
              onPress={() => editor.chain().focus().toggleUnderline().run()}
              className="min-w-8 h-8"
              aria-label="Underline text"
            >
              <FaUnderline size={14} />
            </Button>
          </Tooltip>
        </div>

        <div className="border-r border-gray-300 h-6 mx-1" />

        {/* Lists */}
        <div className="flex gap-1 mr-2">
          <Tooltip content="Bullet List" placement="top">
            <Button
              isIconOnly
              size="sm"
              variant={editor.isActive('bulletList') ? "solid" : "flat"}
              onPress={() => editor.chain().focus().toggleBulletList().run()}
              className="min-w-8 h-8"
              aria-label="Bullet list"
            >
              <FaListUl size={14} />
            </Button>
          </Tooltip>
          <Tooltip content="Numbered List" placement="top">
            <Button
              isIconOnly
              size="sm"
              variant={editor.isActive('orderedList') ? "solid" : "flat"}
              onPress={() => editor.chain().focus().toggleOrderedList().run()}
              className="min-w-8 h-8"
              aria-label="Numbered list"
            >
              <FaListOl size={14} />
            </Button>
          </Tooltip>
        </div>

        <div className="border-r border-gray-300 h-6 mx-1" />

        {/* Alignment Group */}
        <div className="flex gap-1 mr-2">
          <Tooltip content="Align Left" placement="top">
            <Button
              isIconOnly
              size="sm"
              variant={editor.isActive({ textAlign: 'left' }) ? "solid" : "flat"}
              onPress={() => editor.chain().focus().setTextAlign('left').run()}
              className="min-w-8 h-8"
              aria-label="Align text left"
            >
              <FaAlignLeft size={14} />
            </Button>
          </Tooltip>
          <Tooltip content="Align Center" placement="top">
            <Button
              isIconOnly
              size="sm"
              variant={editor.isActive({ textAlign: 'center' }) ? "solid" : "flat"}
              onPress={() => editor.chain().focus().setTextAlign('center').run()}
              className="min-w-8 h-8"
              aria-label="Align text center"
            >
              <FaAlignCenter size={14} />
            </Button>
          </Tooltip>
          <Tooltip content="Align Right" placement="top">
            <Button
              isIconOnly
              size="sm"
              variant={editor.isActive({ textAlign: 'right' }) ? "solid" : "flat"}
              onPress={() => editor.chain().focus().setTextAlign('right').run()}
              className="min-w-8 h-8"
              aria-label="Align text right"
            >
              <FaAlignRight size={14} />
            </Button>
          </Tooltip>
          <Tooltip content="Justify" placement="top">
            <Button
              isIconOnly
              size="sm"
              variant={editor.isActive({ textAlign: 'justify' }) ? "solid" : "flat"}
              onPress={() => editor.chain().focus().setTextAlign('justify').run()}
              className="min-w-8 h-8"
              aria-label="Justify text"
            >
              <FaAlignJustify size={14} />
            </Button>
          </Tooltip>
        </div>

        <div className="border-r border-gray-300 h-6 mx-1" />

        {/* Link Button with Popover */}
        <Tooltip content="Insert Link" placement="top">
          <Button
            isIconOnly
            size="sm"
            variant={editor.isActive('link') ? "solid" : "flat"}
            onPress={handleLinkInsert}
            className="min-w-8 h-8"
            aria-label="Insert link"
          >
            <FaLink size={14} />
          </Button>
        </Tooltip>
      </div>

      <EditorContent editor={editor} className="bg-white min-h-[400px] text-gray-900" />
    </div>
  );
};

export default EmailEditor;