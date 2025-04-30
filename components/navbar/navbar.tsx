import { Navbar, NavbarContent, Select, SelectItem, Switch, Tooltip } from "@heroui/react";
import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import ThemeToggle from "./theme-toggle";

interface Props {
  children: React.ReactNode;
}

export const NavbarWrapper = ({ children }: Props) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  // Use HeroUI dark style for 'dark' and 'leet' themes

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Fetch campaigns on component mount
  useEffect(() => {
    async function loadCampaigns() {
      try {
        setLoading(true);
        const response = await fetch('/api/campaigns');
        const campaignsData = await response.json();
        
        setCampaigns(campaignsData || []);
        
        // If campaigns exist, select the first active one by default
        if (campaignsData && campaignsData.length > 0) {
          const activeCampaign = campaignsData.find((c: { status: string; }) => c.status === 'ACTIVE');
          if (activeCampaign && activeCampaign.id) {
            setSelectedCampaign(activeCampaign.id);
            setIsActive(true);
          } else {
            setSelectedCampaign(campaignsData[0].id || "");
            setIsActive(false);
          }
        }
      } catch (error) {
        console.error('Error loading campaigns:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCampaigns();
  }, []);

  // Handle campaign status change
  const handleCampaignStatusChange = async (newActiveState: boolean) => {
    if (!selectedCampaign) return;
    
    // If trying to activate, we'll just update status directly since verification modal was removed
    await updateCampaignStatus(selectedCampaign, newActiveState);
  };
  
  // Actually update the campaign status
  const updateCampaignStatus = async (campaignId: string, isActive: boolean) => {
    setIsActive(isActive);
    try {
      // Call your API to update campaign status
      const response = await fetch(`/api/campaigns/${campaignId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: isActive ? 'ACTIVE' : 'PAUSED' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update campaign status');
      }
      
      // Update campaigns list if successful
      const updatedCampaigns = campaigns.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, status: isActive ? 'ACTIVE' : 'PAUSED' } 
          : campaign
      );
      setCampaigns(updatedCampaigns);
    } catch (error) {
      console.error('Error updating campaign status:', error);
      // Revert UI state if API call fails
      setIsActive(!isActive);
      alert('Failed to update campaign status. Please try again.');
    }
  };
  

  return (
    <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
      <Navbar
        isBordered
        className={`w-full sticky top-0 z-40 ${
          isLight
            ? 'bg-white border border-green-400 text-black font-mono'
            : 'bg-background/90 backdrop-blur-md'
        }`}
      >
        <NavbarContent justify="end" className="flex items-center gap-4 px-4">
        <Tooltip content={isActive ? 'Pause Campaign' : 'Activate Campaign'}>
        </Tooltip>
        <Switch
              size="md"
              isSelected={isActive}
              onChange={() => handleCampaignStatusChange(!isActive)}
              classNames={{
                base: isLight ? 'bg-white border-green-400' : '',
                thumb: isLight ? 'bg-green-400 border-green-400' : '',
                wrapper: isLight ? 'border-green-400' : ''
              }}
            />
          {/* Campaign selector and status switch */}
          <Select
            size="sm"
            placeholder="Select campaign"
            classNames={{
              trigger: isLight ? 'bg-white text-black border-green-400' : '',
              value: isLight ? 'text-black font-mono' : '',
              popoverContent: isLight ? 'bg-white border-green-400' : '',
            }}
            selectedKeys={selectedCampaign ? [selectedCampaign] : []}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedCampaign(id);
              const campaign = campaigns.find(c => c.id === id);
              setIsActive(campaign?.status === 'ACTIVE');
            }}
            isDisabled={loading || campaigns.length === 0}
          >
            {campaigns.map(c => <SelectItem key={c.id} className={isLight ? 'bg-white text-black font-mono' : ''}>{c.name}</SelectItem>)}
          </Select>
          {/* Theme toggle */}
          <ThemeToggle />
        </NavbarContent>
      </Navbar>

      {children}
    </div>
  );
};
