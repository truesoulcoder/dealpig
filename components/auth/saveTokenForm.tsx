import { useState } from 'react';
import { saveToken } from '@/actions/auth.action';

export default function SaveTokenForm() {
  const [email, setEmail] = useState('');
  const [oauthToken, setOauthToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Saving token...');

    try {
      await saveToken(email, oauthToken, refreshToken);
      setMessage('Token saved successfully!');
      setEmail('');
      setOauthToken('');
      setRefreshToken('');
    } catch (error) {
      console.error('Error saving token:', error);
      setMessage('Failed to save token.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">OAuth Token</label>
        <input
          type="text"
          value={oauthToken}
          onChange={(e) => setOauthToken(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Refresh Token</label>
        <input
          type="text"
          value={refreshToken}
          onChange={(e) => setRefreshToken(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Save Token
      </button>
      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
    </form>
  );
}