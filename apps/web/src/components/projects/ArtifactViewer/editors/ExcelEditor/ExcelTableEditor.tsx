'use client';

import { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ExcelCell {
  value: string;
}

interface ExcelRow {
  cells: ExcelCell[];
}

interface ExcelContent {
  headers: string[];
  rows: ExcelRow[];
}

interface ExcelTableEditorProps {
  content: ExcelContent;
  onSave: (content: ExcelContent) => void;
  onClose: () => void;
}

export function ExcelTableEditor({ content, onSave, onClose }: ExcelTableEditorProps) {
  const [tableData, setTableData] = useState<ExcelContent>(content);
  const [isSaving, setIsSaving] = useState(false);

  const handleHeaderChange = (index: number, value: string) => {
    const newHeaders = [...tableData.headers];
    newHeaders[index] = value;
    setTableData({ ...tableData, headers: newHeaders });
  };

  const handleCellChange = (rowIndex: number, cellIndex: number, value: string) => {
    const newRows = [...tableData.rows];
    newRows[rowIndex].cells[cellIndex].value = value;
    setTableData({ ...tableData, rows: newRows });
  };

  const addRow = () => {
    const newRow: ExcelRow = {
      cells: tableData.headers.map(() => ({ value: '' })),
    };
    setTableData({
      ...tableData,
      rows: [...tableData.rows, newRow],
    });
  };

  const removeRow = (index: number) => {
    const newRows = tableData.rows.filter((_, i) => i !== index);
    setTableData({ ...tableData, rows: newRows });
  };

  const addColumn = () => {
    const newHeaders = [...tableData.headers, `Column ${tableData.headers.length + 1}`];
    const newRows = tableData.rows.map((row) => ({
      cells: [...row.cells, { value: '' }],
    }));
    setTableData({
      headers: newHeaders,
      rows: newRows,
    });
  };

  const removeColumn = (index: number) => {
    const newHeaders = tableData.headers.filter((_, i) => i !== index);
    const newRows = tableData.rows.map((row) => ({
      cells: row.cells.filter((_, i) => i !== index),
    }));
    setTableData({
      headers: newHeaders,
      rows: newRows,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(tableData);
      onClose();
    } catch (error) {
      console.error('Error saving table:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-4 border-b border-border bg-muted/30">
        <Button size="sm" variant="outline" onClick={addRow}>
          <Plus className="h-4 w-4 mr-2" />
          Add Row
        </Button>
        <Button size="sm" variant="outline" onClick={addColumn}>
          <Plus className="h-4 w-4 mr-2" />
          Add Column
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-4">
        <Table>
          <TableHeader>
            <TableRow>
              {tableData.headers.map((header, index) => (
                <TableHead key={index} className="min-w-[150px]">
                  <div className="flex items-center gap-2">
                    <Input
                      value={header}
                      onChange={(e) => handleHeaderChange(index, e.target.value)}
                      className="h-8 font-semibold"
                      placeholder={`Column ${index + 1}`}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeColumn(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.cells.map((cell, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Input
                      value={cell.value}
                      onChange={(e) =>
                        handleCellChange(rowIndex, cellIndex, e.target.value)
                      }
                      className="h-9"
                      placeholder="-"
                    />
                  </TableCell>
                ))}
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeRow(rowIndex)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {tableData.rows.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No data. Click &quot;Add Row&quot; to start.</p>
          </div>
        )}
      </div>

      {/* Actions */}
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