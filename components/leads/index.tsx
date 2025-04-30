import React, { useState } from 'react';
import ProcessLeadsSwitch from './ProcessLeadsSwitch';

// Define the interface for the component props
interface UploadLeadsFormProps {
    onFileSelect: (fileName: string | null) => void;
}

// Update the component to accept props
const UploadLeadsForm: React.FC<UploadLeadsFormProps> = ({ onFileSelect }) => {
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const fileName = file?.name || null;
        setSelectedFileName(fileName);
        onFileSelect(fileName); // Call the onFileSelect prop
    };

    return (
        <form>
            <input type="file" onChange={handleFileChange} />
            <p>Selected File: {selectedFileName || "No file chosen"}</p>
        </form>
    );
};

export default function LeadsSection() {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <UploadLeadsForm onFileSelect={setSelectedFileName} />
      <ProcessLeadsSwitch selectedFileName={selectedFileName} />
    </div>
  );
}