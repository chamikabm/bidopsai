'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/editor/RichTextEditor';

interface DocumentEditorProps {
  content: string;
  onSave: (content: string) => void;
  onClose: () => void;
}

export function DocumentEditor({ content, onSave, onClose }: DocumentEditorProps) {
  const [editorContent, setEditorContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editorContent);
      onClose();
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <RichTextEditor
          content={editorContent}
          onChange={setEditorContent}
          placeholder="Start writing your document..."
          className="h-full"
        />
      </div>
      
      <div className="flex justify-end gap-4 p-4 border-t border-border bg-background">
        <Button variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}