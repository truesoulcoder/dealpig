import { Suspense } from "react";
import { notFound } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";
// Remove import for missing auth module and use alternative
// import { auth } from "../../../../lib/auth";
import { getSession } from "@/actions/auth.action";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../components/ui/tabs";
import SenderValidation from "../../../../components/campaigns/sender-validation";
// Create a simple Skeleton component instead of importing from missing module
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

// Fetch campaign data
async function getCampaign(id: string) {
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select("*, templates:templateIds(*), documentTemplates(*), senderIds")
    .eq("id", id)
    .single();
  
  if (error || !campaign) {
    return null;
  }

  return campaign;
}

// Loading component for suspense
function CampaignEditSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-6 w-2/3" />
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

// Campaign edit page
export default async function CampaignEditPage({ params }: { params: { id: string } }) {
  // Get current user
  // const session = await auth();
  // Replace with available auth method
  const session = await getSession();
  
  if (!session || !session.user) {
    return notFound();
  }

  const campaign = await getCampaign(params.id);
  
  if (!campaign) {
    return notFound();
  }

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
        <p className="text-muted-foreground">{campaign.description}</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="senders">Senders</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4 pt-4">
          <div className="grid gap-4">
            {/* Campaign details would go here */}
            <p>Campaign ID: {campaign.id}</p>
            <p>Status: {campaign.status}</p>
            <p>Created: {new Date(campaign.created_at).toLocaleDateString()}</p>
          </div>
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-4 pt-4">
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Email Templates</h2>
            {/* List of email templates would go here */}
            <p>Number of templates: {campaign.templates?.length || 0}</p>
          </div>
        </TabsContent>
        
        <TabsContent value="senders" className="space-y-4 pt-4">
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Sender Configuration</h2>
            <p className="text-sm text-slate-600">
              Configure and validate the senders for this campaign. Each sender should be validated 
              before launching the campaign to ensure proper email delivery.
            </p>
            
            {/* Sender list would go here */}
            <p>Number of senders: {campaign.senderIds?.length || 0}</p>
            
            {/* Sender validation component */}
            <Suspense fallback={<CampaignEditSkeleton />}>
              <SenderValidation 
                campaignId={campaign.id}
                senderIds={campaign.senderIds || []}
                userId={session.user.id}
                userEmail={session.user.email || ''}
              />
            </Suspense>
          </div>
        </TabsContent>
        
        <TabsContent value="leads" className="space-y-4 pt-4">
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Campaign Leads</h2>
            {/* Lead targeting and list would go here */}
            <p>Lead targeting settings would be displayed here</p>
          </div>
        </TabsContent>
        
        <TabsContent value="schedule" className="space-y-4 pt-4">
          <div className="grid gap-4">
            <h2 className="text-xl font-semibold">Campaign Schedule</h2>
            {/* Schedule settings would go here */}
            <p>Campaign scheduling options would be displayed here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}