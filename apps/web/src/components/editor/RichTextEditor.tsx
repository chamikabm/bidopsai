'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { getTipTapExtensions } from '@/lib/editor/tiptap/extensions';
import { MenuBar } from './MenuBar/MenuBar';
import type { EditorProps } from '@/types/editor.types';

export function RichTextEditor({
  content,
  onChange,
  editable = true,
  placeholder = 'Start typing...',
  className = '',
}: EditorProps) {
  const editor = useEditor({
    extensions: getTipTapExtensions(placeholder),
    content,
    editable,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange(JSON.stringify(json));
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  return (
    <div className={`border border-border rounded-md ${className}`}>
      {editable && <MenuBar editor={editor} />}
      <EditorContent 
        editor={editor} 
        className="tiptap-editor"
      />
    </div>
  );
}