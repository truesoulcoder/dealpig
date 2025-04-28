import UploadLeadsForm from '../../../components/leads/UploadLeadsForm';

export default function LeadsPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Upload Leads</h1>
      <UploadLeadsForm />
    </div>
  );
}