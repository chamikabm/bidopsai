'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { useEffect } from 'react';
import { MenuBar } from './MenuBar';
import { cn } from '@/lib/utils';

interface DocumentEditorProps {
  content: any;
  onChange: (content: any) => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
}

export function DocumentEditor({
  content,
  onChange,
  editable = true,
  placeholder = 'Start writing...',
  className,
}: DocumentEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Typography,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none',
          'focus:outline-none min-h-[300px] p-4',
          'prose-headings:font-semibold',
          'prose-p:text-foreground',
          'prose-a:text-primary',
          'prose-strong:text-foreground',
          'prose-code:text-foreground',
          'prose-pre:bg-muted',
          'prose-blockquote:border-l-primary',
          'prose-hr:border-border',
          'prose-table:border-border',
          'prose-th:border-border',
          'prose-td:border-border'
        ),
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getJSON()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('border rounded-lg overflow-hidden bg-background', className)}>
      {editable && <MenuBar editor={editor} />}
      <EditorContent editor={editor} />
      {editable && (
        <div className="border-t px-4 py-2 text-xs text-muted-foreground flex justify-between">
          <span>
            {editor.storage.characterCount.characters()} characters
          </span>
          <span>
            {editor.storage.characterCount.words()} words
          </span>
        </div>
      )}
    </div>
  );
}
