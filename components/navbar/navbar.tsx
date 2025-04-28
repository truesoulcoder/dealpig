import { Input, Link, Navbar, NavbarContent, Select, SelectItem, Switch, Tooltip } from "@heroui/react";
import React, { useEffect, useState } from "react";
import { SearchIcon } from "../icons/searchicon";
import { BurguerButton } from "./burguer-button";
import { UserDropdown } from "./user-dropdown";
import ThemeToggle from "./theme-toggle";
import { useTheme } from "next-themes";

interface Props {
  children: React.ReactNode;
}

export const NavbarWrapper = ({ children }: Props) => {
  const { theme } = useTheme();
  const isLeetTheme = theme === 'leet';
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  
  // State for verification modal
  const [verificationModalOpen, setVerificationModalOpen] = useState<boolean>(false);
  const [campaignToActivate, setCampaignToActivate] = useState<{id: string, name: string} | null>(null);

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
        className={`w-full sticky top-0 z-40 ${isLeetTheme ? 'bg-black border-green-400' : 'bg-background/90 backdrop-blur-md'}`}
        classNames={{
          wrapper: "w-full max-w-full",
        }}
      >
        <NavbarContent className="md:hidden">
          <BurguerButton />
        </NavbarContent>
        <NavbarContent className="w-full max-md:hidden">
          <Input
            startContent={<SearchIcon className={isLeetTheme ? 'text-green-400' : ''} />}
            isClearable
            className={`w-full max-w-xs ${isLeetTheme ? 'leet-input' : ''}`}
            classNames={{
              input: `w-full ${isLeetTheme ? 'text-green-400 font-mono' : ''}`,
              mainWrapper: "w-full",
              inputWrapper: isLeetTheme ? 'bg-black border-green-400 rounded-none' : '',
            }}
            placeholder="Search..."
          />
          
          {/* Campaign selector and controls */}
          <div className="flex items-center gap-2 ml-4">
            <Select 
              size="sm"
              placeholder="Select campaign"
              className={`min-w-[200px] ${isLeetTheme ? 'bg-black text-green-400 border-green-400 font-mono rounded-none' : ''}`}
              classNames={{
                trigger: isLeetTheme ? 'bg-black text-green-400 border-green-400 rounded-none' : '',
                value: isLeetTheme ? 'text-green-400 font-mono' : '',
                popover: isLeetTheme ? 'bg-black border-green-400 rounded-none' : '',
              }}
              selectedKeys={selectedCampaign ? [selectedCampaign] : []}
              onChange={(e) => {
                const newCampaignId = e.target.value;
                setSelectedCampaign(newCampaignId);
                // Update active state based on selected campaign
                const campaign = campaigns.find(c => c.id === newCampaignId);
                setIsActive(campaign?.status === 'ACTIVE');
              }}
              isDisabled={loading || campaigns.length === 0}
            >
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} className={isLeetTheme ? 'bg-black text-green-400 font-mono' : ''}>
                  {campaign.name}
                </SelectItem>
              ))}
            </Select>
            
            <Tooltip content={isActive ? "Pause Campaign" : "Activate Campaign"}>
              <Switch
                size="sm"
                isSelected={isActive}
                onChange={() => handleCampaignStatusChange(!isActive)}
                isDisabled={!selectedCampaign || loading}
                aria-label="Campaign status toggle"
                color={isLeetTheme ? undefined : "success"}
                classNames={{
                  wrapper: isLeetTheme ? 'border-green-400' : '',
                  thumb: isLeetTheme ? 'bg-green-400 border-green-400' : '',
                  track: isLeetTheme ? 'bg-black border-green-400' : '',
                }}
              />
            </Tooltip>
          </div>
        </NavbarContent>
        <NavbarContent
          justify="end"
          className="w-fit data-[justify=end]:flex-grow-0"
        >
          <NavbarContent className="flex items-center gap-4">
            <ThemeToggle />
            <UserDropdown />
          </NavbarContent>
        </NavbarContent>
      </Navbar>
      
      {children}
    </div>
  );
};
