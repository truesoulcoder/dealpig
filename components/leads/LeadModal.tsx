import React, { useState } from 'react';

interface LeadModalProps {
  open: boolean;
  onClose: () => void;
  lead: Record<string, any>;
  onSave: (updated: Record<string, any>) => void;
}

export default function LeadModal({ open, onClose, lead, onSave }: LeadModalProps) {
  const [form, setForm] = useState({ ...lead });

  if (!open) return null;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSave() {
    onSave(form);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-semibold mb-4">Edit Lead</h2>
        <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
          <div className="grid grid-cols-2 gap-4 max-h-96 overflow-auto">
            {Object.entries(form).map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <label className="text-xs font-medium mb-1 capitalize">{key.replace(/_/g, ' ')}</label>
                <input
                  name={key}
                  value={value ?? ''}
                  onChange={handleChange}
                  className="border rounded px-2 py-1 text-sm"
                  disabled={key === 'id'}
                />
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="px-3 py-1 rounded bg-gray-200" onClick={onClose}>Cancel</button>
            <button type="submit" className="px-3 py-1 rounded bg-blue-600 text-white">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
