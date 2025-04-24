import { getLeadById, getContactsByLeadId } from '@/lib/database';
import LeadDetail from './LeadDetail';

export default async function LeadPage({ params }: { params: { id: string } }) {
  // Fetch lead data on the server
  const leadData = await getLeadById(params.id);
  
  // Fetch contacts for this lead
  const contactsData = leadData?.id ? await getContactsByLeadId(leadData.id) : [];

  // Return client component with server-fetched data
  return <LeadDetail lead={leadData} contacts={contactsData} />;
}