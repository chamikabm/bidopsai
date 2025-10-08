import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Placeholder from '@tiptap/extension-placeholder';

export const getTipTapExtensions = (placeholder?: string) => [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3, 4, 5, 6],
    },
    bulletList: {
      keepMarks: true,
      keepAttributes: false,
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false,
    },
    codeBlock: {
      HTMLAttributes: {
        class: 'bg-muted rounded-md p-4 font-mono text-sm',
      },
    },
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
    alignments: ['left', 'center', 'right', 'justify'],
  }),
  Underline,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-primary underline underline-offset-4 hover:text-primary/80',
    },
  }),
  Image.configure({
    inline: true,
    HTMLAttributes: {
      class: 'rounded-md max-w-full h-auto',
    },
  }),
  Table.configure({
    resizable: true,
    HTMLAttributes: {
      class: 'border-collapse table-auto w-full',
    },
  }),
  TableRow,
  TableCell.configure({
    HTMLAttributes: {
      class: 'border border-border p-2',
    },
  }),
  TableHeader.configure({
    HTMLAttributes: {
      class: 'border border-border p-2 bg-muted font-semibold',
    },
  }),
  Highlight.configure({
    multicolor: true,
  }),
  TextStyle,
  Color,
  Placeholder.configure({
    placeholder: placeholder || 'Start typing...',
    emptyEditorClass: 'is-editor-empty',
  }),
];