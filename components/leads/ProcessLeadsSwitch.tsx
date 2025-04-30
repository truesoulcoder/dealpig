import React, { useState } from 'react';
import { putLeadsInTable } from './putLeadsInTable';

const ProcessLeadsSwitch = ({ selectedFileName }: { selectedFileName: string | null }) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSwitchChange = async () => {
        if (!selectedFileName) {
            console.error('No file selected to process.');
            return;
        }

        setIsProcessing(!isProcessing);
        if (!isProcessing) {
            try {
                await putLeadsInTable(selectedFileName);
                console.log('Leads have been successfully processed and added to the table.');
            } catch (error) {
                console.error('Error processing leads:', error);
            }
        }
    };

    return (
        <div>
            <label>
                <input
                    type="checkbox"
                    checked={isProcessing}
                    onChange={handleSwitchChange}
                />
                Process Leads
            </label>
        </div>
    );
};

export default ProcessLeadsSwitch;