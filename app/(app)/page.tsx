import { Tabs, Tab, Card, CardBody } from "@heroui/react";
import CampaignDashboard from "@/components/home/campaign-dashboard";
import LeadsTable from '@/components/table/leadsTable';
import SaveTokenForm from '@/components/auth/saveTokenForm';
import GenerateDocumentForm from '@/components/home/generateDocumentForm';
import SendEmailForm from '@/components/home/sendEmailForm';
import UploadCsvForm from '@/components/home/uploadCsvForm';

export default function DashboardPage() {
  return (
    <div className="p-4">
      {/* Campaign Dashboard as the main screen */}
      <CampaignDashboard />
      
      {/* Legacy tools available through tabs */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Manual Tools</h2>
        <Card>
          <CardBody>
            <Tabs aria-label="Manual Tools">
              <Tab key="leads-table" title="Leads Management">
                <div className="p-2 mt-4">
                  <LeadsTable />
                </div>
              </Tab>
              <Tab key="generate-document" title="Generate LOI">
                <div className="p-2 mt-4">
                  <GenerateDocumentForm />
                </div>
              </Tab>
              <Tab key="send-email" title="Send Email">
                <div className="p-2 mt-4">
                  <SendEmailForm />
                </div>
              </Tab>
              <Tab key="upload-csv" title="Import Leads">
                <div className="p-2 mt-4">
                  <UploadCsvForm />
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </section>
    </div>
  );
}
