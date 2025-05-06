'use client';

import { useState, useEffect } from 'react';
import { Template } from '@/helpers/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Edit, Trash2 } from 'lucide-react';

interface TemplatesTableProps {
  onEdit: (template: Template) => void;
  onAddNew: () => void;
  refreshKey: number; // Prop to trigger re-fetch
}

export default function TemplatesTable({ onEdit, onAddNew, refreshKey }: TemplatesTableProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchTemplates() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/templates');
      if (!res.ok) {
        throw new Error(`Failed to fetch templates: ${res.statusText}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received for templates.');
      }
      setTemplates(data as Template[]); // Assuming the API returns the correct shape
    } catch (err) {
      console.error('fetchTemplates error:', err);
      setError(err instanceof Error ? err.message : String(err));
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Failed to delete template: ${res.statusText}`);
      }
      // Re-fetch templates after successful deletion
      fetchTemplates(); 
      // Consider adding a success notification here
    } catch (err) {
      console.error('deleteTemplate error:', err);
      setError(err instanceof Error ? err.message : String(err));
      // Consider adding an error notification here
    }
  }

  // Fetch templates on initial mount and when refreshKey changes
  useEffect(() => {
    fetchTemplates();
  }, [refreshKey]);

  if (loading) {
    return <p>Loading templates...</p>;
  }

  if (error) {
    return <div className="text-danger-500 flex items-center"><AlertCircle className="mr-2 h-4 w-4"/> Error loading templates: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={onAddNew}>Add New Template</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center">No templates found.</TableCell>
            </TableRow>
          ) : (
            templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>{template.name}</TableCell>
                <TableCell>{template.type || 'N/A'}</TableCell>
                <TableCell>{template.subject || '-'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(template)} className="mr-2">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteTemplate(template.id)} className="text-danger-500 hover:text-danger-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
