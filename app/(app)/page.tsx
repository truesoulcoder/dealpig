import LeadsTable from '@/components/table/leadsTable';
import SaveTokenForm from '@/components/auth/saveTokenForm';
import GenerateDocumentForm from '@/components/home/generateDocumentForm';
import SendEmailForm from '@/components/home/sendEmailForm';

export default function DashboardPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Leads</h2>
        <LeadsTable />
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Save OAuth Tokens</h2>
        <SaveTokenForm />
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Generate Document</h2>
        <GenerateDocumentForm />
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Send Email</h2>
        <SendEmailForm />
      </section>
    </div>
  );
}
