import LeadsSection from '@/components/leads';

export default function LeadsPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Lead Management</h1>
      <LeadsSection />
    </div>
  );
}