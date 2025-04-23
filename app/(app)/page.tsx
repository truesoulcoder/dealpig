import LeadsTable from '@/components/table/leadsTable';
import SaveTokenForm from '@/components/auth/saveTokenForm';
import GenerateDocumentForm from '@/components/home/generateDocumentForm';
import SendEmailForm from '@/components/home/sendEmailForm';
import UploadCsvForm from '@/components/home/uploadCsvForm';
import { Tabs, Tab } from "@heroui/react";

export default function DashboardPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Deal Pig Dashboard</h1>
      
      {/* Leads Section */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Leads Management</h2>
          <div className="bg-gray-100 rounded-md p-2 text-sm">
            <span className="font-medium">Email Status: </span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-1">Sent</span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1">Opened</span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-1">Clicked</span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mr-1">Bounced</span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>
          </div>
        </div>
        <LeadsTable />
      </section>
      
      {/* Core Features in Tabs */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Workflow Tools</h2>
        <Tabs aria-label="Workflow Tools">
          <Tab key="generate-document" title="Generate LOI">
            <div className="p-2">
              <GenerateDocumentForm />
            </div>
          </Tab>
          <Tab key="send-email" title="Send Email">
            <div className="p-2">
              <SendEmailForm />
            </div>
          </Tab>
          <Tab key="upload-csv" title="Import Leads">
            <div className="p-2">
              <UploadCsvForm />
            </div>
          </Tab>
          <Tab key="save-tokens" title="OAuth Settings">
            <div className="p-2">
              <SaveTokenForm />
            </div>
          </Tab>
        </Tabs>
      </section>
      
      {/* Statistics Summary */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Activity Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">LOIs Generated</h3>
            <p className="text-3xl font-bold">12</p>
            <p className="text-sm text-gray-500">This month</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Emails Sent</h3>
            <p className="text-3xl font-bold">28</p>
            <p className="text-sm text-gray-500">This month</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">Response Rate</h3>
            <p className="text-3xl font-bold">32%</p>
            <p className="text-sm text-gray-500">Open rate</p>
          </div>
        </div>
      </section>
    </div>
  );
}
