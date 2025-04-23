import { useState } from 'react';
import { sendEmail } from '@/actions/sendEmail.action';

export default function SendEmailForm() {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachmentPath, setAttachmentPath] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Sending email...');

    try {
      await sendEmail({ to, subject, body, attachmentPath });
      setMessage('Email sent successfully!');
      setTo('');
      setSubject('');
      setBody('');
      setAttachmentPath('');
    } catch (error) {
      console.error('Error sending email:', error);
      setMessage('Failed to send email.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Recipient Email</label>
        <input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Attachment Path (Optional)</label>
        <input
          type="text"
          value={attachmentPath}
          onChange={(e) => setAttachmentPath(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Send Email
      </button>
      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
    </form>
  );
}