'use client';

import { useState, useEffect } from 'react';
import { Template } from '@/helpers/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';

interface TemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  templateToEdit?: Template | null;
  onSave: () => void; // Callback to trigger refresh in parent
}

const templateTypes = ['EMAIL', 'LOI', 'CONTRACT', 'LETTER'];

export default function TemplateEditor({ isOpen, onClose, templateToEdit, onSave }: TemplateEditorProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<Template['type']>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens or templateToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (templateToEdit) {
        setName(templateToEdit.name);
        setType(templateToEdit.type);
        setSubject(templateToEdit.subject || '');
        setBody(templateToEdit.body);
      } else {
        // Reset for new template
        setName('');
        setType(null);
        setSubject('');
        setBody('');
      }
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen, templateToEdit]);

  const isEmailType = type === 'EMAIL';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!name || !type || !body) {
        setError('Name, Type, and Body are required.');
        setIsLoading(false);
        return;
    }
    if (isEmailType && !subject) {
        setError('Subject is required for EMAIL templates.');
        setIsLoading(false);
        return;
    }

    const templateData = {
      name,
      type,
      subject: isEmailType ? subject : null,
      body,
    };

    const url = templateToEdit ? `/api/templates/${templateToEdit.id}` : '/api/templates';
    const method = templateToEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${templateToEdit ? 'update' : 'create'} template`);
      }

      onSave(); // Trigger refresh in parent component
      onClose(); // Close the modal

    } catch (err) {
      console.error('handleSubmit error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{templateToEdit ? 'Edit Template' : 'Create New Template'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Type
            </Label>
            <Select value={type ?? ''} onValueChange={(value) => setType(value as Template['type'])} required>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {templateTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isEmailType && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Subject
              </Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="col-span-3" required={isEmailType} />
            </div>
          )}
          <div className="grid grid-cols-1 gap-2">
             <Label htmlFor="body">Body</Label>
             <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[200px]" required />
             {/* Placeholder for a richer editor potentially */} 
             <p className="text-sm text-muted-foreground">You can use placeholders like {'{Lead.OwnerName}'}, {'{Lead.PropertyAddress}'}, etc.</p>
          </div>

          {error && (
             <div className="text-danger-500 flex items-center text-sm">
               <AlertCircle className="mr-1 h-4 w-4" /> {error}
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Template'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
