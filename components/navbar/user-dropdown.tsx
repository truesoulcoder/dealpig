import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Navbar,
  NavbarItem,
} from "@heroui/react";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAuthCookie } from "@/actions/auth.action";
import { ThemeToggle } from "./theme-toggle";

export const UserDropdown = () => {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("user@example.com");

  // Get user info on component mount
  useEffect(() => {
    async function getUserInfo() {
      try {
        // This is a placeholder - you'll need to implement a proper API endpoint
        const response = await fetch('/api/user/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.email) {
            setUserEmail(data.email);
          }
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    }
    
    getUserInfo();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await deleteAuthCookie();
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, []);

  // Handle navigation based on dropdown action key
  const handleAction = useCallback((actionKey: React.Key) => {
    switch (actionKey) {
      case 'profile':
        router.push('/profile');
        break;
      case 'settings':
        router.push('/settings');
        break;
      case 'team_settings':
        router.push('/team-settings');
        break;
      case 'analytics':
        router.push('/analytics');
        break;
      case 'system':
        router.push('/system');
        break;
      case 'configurations':
        router.push('/configurations');
        break;
      case 'help_and_feedback':
        router.push('/help-and-feedback');
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  }, [router, handleLogout]);

  return (
    <Dropdown>
      <NavbarItem>
        <DropdownTrigger>
          <Avatar
            as='button'
            color='secondary'
            size='md'
            src='https://i.pravatar.cc/150?u=a042581f4e29026704d'
          />
        </DropdownTrigger>
      </NavbarItem>
      <DropdownMenu
        aria-label='User menu actions'
        onAction={handleAction}>
        <DropdownItem
          key='profile'
          className='flex flex-col justify-start w-full items-start'>
          <p>Signed in as</p>
          <p>{userEmail}</p>
        </DropdownItem>
        <DropdownItem key='settings'>My Settings</DropdownItem>
        <DropdownItem key='team_settings'>Team Settings</DropdownItem>
        <DropdownItem key='analytics'>Analytics</DropdownItem>
        <DropdownItem key='system'>System</DropdownItem>
        <DropdownItem key='configurations'>Configurations</DropdownItem>
        <DropdownItem key='help_and_feedback'>Help & Feedback</DropdownItem>
        <DropdownItem
          key='logout'
          color='danger'
          className='text-danger'>
          Log Out
        </DropdownItem>
        <DropdownItem key='switch'>
          <ThemeToggle />
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};
