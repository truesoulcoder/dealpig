"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import { Button } from '@heroui/react';
import { useEffect } from 'react';
import { 
  FaBold, FaItalic, FaUnderline, FaAlignLeft, 
  FaAlignCenter, FaAlignRight, FaAlignJustify, 
  FaLink, FaHeading, FaParagraph 
} from 'react-icons/fa';

// Interface for the editor props
interface EmailEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  onEditorReady?: (editor: any) => void;
}

const EmailEditor = ({ initialContent = '', onChange, placeholder = 'Write your email here...', onEditorReady }: EmailEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link,
      Image,
      Color,
      TextStyle,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose max-w-none focus:outline-none p-4 min-h-[300px]',
        placeholder,
      },
    },
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

  return (
    <div className="email-editor">
      <div className="border-b border-gray-300 p-2 flex flex-wrap gap-1 items-center overflow-x-auto">
        {/* Text Style Group */}
        <div className="flex gap-1 mr-2">
          <Button
            isIconOnly
            size="sm"
            variant={editor.isActive('heading', { level: 1 }) ? "solid" : "ghost"}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className="min-w-8 h-8"
            title="Heading 1"
          >
            <FaHeading size={14} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant={editor.isActive('paragraph') ? "solid" : "ghost"}
            onClick={() => editor.chain().focus().setParagraph().run()}
            className="min-w-8 h-8"
            title="Paragraph"
          >
            <FaParagraph size={14} />
          </Button>
        </div>

        <div className="border-r border-gray-300 h-6 mx-1" />

        {/* Format Group */}
        <div className="flex gap-1 mr-2">
          <Button
            isIconOnly
            size="sm"
            variant={editor.isActive('bold') ? "solid" : "ghost"}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className="min-w-8 h-8"
            title="Bold"
          >
            <FaBold size={14} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant={editor.isActive('italic') ? "solid" : "ghost"}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className="min-w-8 h-8"
            title="Italic"
          >
            <FaItalic size={14} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant={editor.isActive('underline') ? "solid" : "ghost"}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className="min-w-8 h-8"
            title="Underline"
          >
            <FaUnderline size={14} />
          </Button>
        </div>

        <div className="border-r border-gray-300 h-6 mx-1" />

        {/* Alignment Group */}
        <div className="flex gap-1 mr-2">
          <Button
            isIconOnly
            size="sm"
            variant={editor.isActive({ textAlign: 'left' }) ? "solid" : "ghost"}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className="min-w-8 h-8"
            title="Align Left"
          >
            <FaAlignLeft size={14} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant={editor.isActive({ textAlign: 'center' }) ? "solid" : "ghost"}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className="min-w-8 h-8"
            title="Align Center"
          >
            <FaAlignCenter size={14} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant={editor.isActive({ textAlign: 'right' }) ? "solid" : "ghost"}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className="min-w-8 h-8"
            title="Align Right"
          >
            <FaAlignRight size={14} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant={editor.isActive({ textAlign: 'justify' }) ? "solid" : "ghost"}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className="min-w-8 h-8"
            title="Justify"
          >
            <FaAlignJustify size={14} />
          </Button>
        </div>

        <div className="border-r border-gray-300 h-6 mx-1" />

        {/* Link Group */}
        <div className="flex gap-1">
          <Button
            isIconOnly
            size="sm"
            variant={editor.isActive('link') ? "solid" : "ghost"}
            onClick={() => {
              const url = window.prompt('URL');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            className="min-w-8 h-8"
            title="Insert Link"
          >
            <FaLink size={14} />
          </Button>
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
};

export default EmailEditor;