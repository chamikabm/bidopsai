import type { Editor as TipTapEditor } from '@tiptap/react';

export interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
}

export interface MenuBarProps {
  editor: TipTapEditor | null;
}

export interface BubbleMenuProps {
  editor: TipTapEditor | null;
}

export interface FloatingMenuProps {
  editor: TipTapEditor | null;
}

// TipTap JSON content types
export interface TipTapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  marks?: TipTapMark[];
  text?: string;
}

export interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TipTapDocument {
  type: 'doc';
  content: TipTapNode[];
}

// Editor state types
export type EditorFormat = 'heading' | 'paragraph' | 'bulletList' | 'orderedList' | 'codeBlock';
export type EditorAlignment = 'left' | 'center' | 'right' | 'justify';
export type EditorTextStyle = 'bold' | 'italic' | 'underline' | 'strike' | 'code';