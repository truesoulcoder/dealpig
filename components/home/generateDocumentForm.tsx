import { useState } from 'react';
import { generateLoi } from '@/actions/generateLoi.action';

export default function GenerateDocumentForm() {
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyCity, setPropertyCity] = useState('');
  const [propertyState, setPropertyState] = useState('');
  const [propertyZip, setPropertyZip] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [earnestMoney, setEarnestMoney] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Generating document...');

    try {
      const filePath = await generateLoi({
        propertyAddress,
        propertyCity,
        propertyState,
        propertyZip,
        recipientName,
        offerPrice: parseFloat(offerPrice),
        earnestMoney: parseFloat(earnestMoney),
        closingDate,
      });
      setMessage(`Document generated successfully! Download it here: ${filePath}`);
    } catch (error) {
      console.error('Error generating document:', error);
      setMessage('Failed to generate document.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Property Address</label>
        <input
          type="text"
          value={propertyAddress}
          onChange={(e) => setPropertyAddress(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">City</label>
        <input
          type="text"
          value={propertyCity}
          onChange={(e) => setPropertyCity(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">State</label>
        <input
          type="text"
          value={propertyState}
          onChange={(e) => setPropertyState(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Zip</label>
        <input
          type="text"
          value={propertyZip}
          onChange={(e) => setPropertyZip(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Recipient Name</label>
        <input
          type="text"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Offer Price</label>
        <input
          type="number"
          value={offerPrice}
          onChange={(e) => setOfferPrice(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Earnest Money</label>
        <input
          type="number"
          value={earnestMoney}
          onChange={(e) => setEarnestMoney(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Closing Date</label>
        <input
          type="date"
          value={closingDate}
          onChange={(e) => setClosingDate(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Generate Document
      </button>
      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
    </form>
  );
}