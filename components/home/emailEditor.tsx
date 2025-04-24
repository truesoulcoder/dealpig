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

// Interface for the editor props
interface EmailEditorProps {
  initialContent?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

const EmailEditor = ({ initialContent = '', onChange, placeholder = 'Write your email here...' }: EmailEditorProps) => {
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

  if (!editor) {
    return <div className="min-h-[300px] flex items-center justify-center">Loading editor...</div>;
  }

  return (
    <div className="email-editor">
      <div className="border-b border-gray-300 p-2 flex flex-wrap gap-1 items-center">
        <div className="flex gap-1 mr-2">
          <Button
            size="sm"
            variant={editor.isActive('bold') ? "solid" : "ghost"}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <span className="font-bold">B</span>
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('italic') ? "solid" : "ghost"}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <span className="italic">I</span>
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('underline') ? "solid" : "ghost"}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <span className="underline">U</span>
          </Button>
        </div>

        <div className="border-r border-gray-300 h-6 mx-2" />

        <div className="flex gap-1 mr-2">
          <Button
            size="sm"
            variant={editor.isActive({ textAlign: 'left' }) ? "solid" : "ghost"}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            Left
          </Button>
          <Button
            size="sm"
            variant={editor.isActive({ textAlign: 'center' }) ? "solid" : "ghost"}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            Center
          </Button>
          <Button
            size="sm"
            variant={editor.isActive({ textAlign: 'right' }) ? "solid" : "ghost"}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            Right
          </Button>
        </div>

        <div className="border-r border-gray-300 h-6 mx-2" />

        <div className="flex gap-1">
          <Button
            size="sm"
            variant={editor.isActive('link') ? "solid" : "ghost"}
            onClick={() => {
              const url = window.prompt('URL');
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
          >
            Link
          </Button>
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
};

export default EmailEditor;