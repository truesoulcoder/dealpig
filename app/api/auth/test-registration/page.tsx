'use client';

import { useState } from 'react';

export default function TestRegistrationPage() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('Password123!');
  const [name, setName] = useState('Test User');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const handleRegister = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      const response = await fetch('/api/auth/register-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });
      
      const data = await response.json();
      setResult({
        status: response.status,
        statusText: response.statusText,
        data
      });
    } catch (error: any) {
      setResult({
        error: true,
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Test Registration API</h1>
      
      <div className="mb-4">
        <label className="block mb-1">Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded p-2 w-full"
        />
      </div>
      
      <div className="mb-4">
        <label className="block mb-1">Password:</label>
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border rounded p-2 w-full"
        />
      </div>
      
      <div className="mb-4">
        <label className="block mb-1">Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded p-2 w-full"
        />
      </div>
      
      <button
        onClick={handleRegister}
        disabled={loading}
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Test Register'}
      </button>
      
      {result && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Response:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}