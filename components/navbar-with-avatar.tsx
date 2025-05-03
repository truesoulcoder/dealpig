import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  DropdownItem,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  Avatar,
} from "@heroui/react";

import { useTheme } from "./ui/theme-context";
import User from "./User";
import { Icon } from "@iconify/react";
import { useState } from "react";

export default function NavbarWithAvatar() {
  const { theme, toggleTheme } = useTheme();
  const [burgerOpen, setBurgerOpen] = useState(false);

  // User component fetches user info from Supabase/Google
  return (
    <Navbar>
      {/* Left: Burger Menu */}
      <NavbarBrand>
        <button
          aria-label="Open menu"
          className="mr-2 p-2 rounded hover:bg-default-100 focus:outline-none"
          onClick={() => setBurgerOpen((b) => !b)}
        >
          <Icon icon="mdi:menu" width={28} height={28} />
        </button>
      </NavbarBrand>

      {/* Center: Theme Switcher */}
      <NavbarContent className="flex gap-4" justify="center">
        <NavbarItem>
          <button
            className={`px-4 py-1 rounded ${theme === 'heroui' ? 'bg-primary-600 text-white' : 'bg-default-100'}`}
            onClick={() => theme !== 'heroui' && toggleTheme()}
            aria-pressed={theme === 'heroui'}
          >
            Dark Theme
          </button>
        </NavbarItem>
        <NavbarItem>
          <button
            className={`px-4 py-1 rounded ${theme === 'leet' ? 'bg-green-500 text-black' : 'bg-default-100'}`}
            onClick={() => theme !== 'leet' && toggleTheme()}
            aria-pressed={theme === 'leet'}
          >
            L33T Theme
          </button>
        </NavbarItem>
      </NavbarContent>

      {/* Right: Profile Avatar & Dropdown */}
      <NavbarContent as="div" justify="end">
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            {/* User component fetches and shows avatar, name, email */}
            <User showAvatar size="sm" />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat">
            <DropdownItem key="settings">Settings</DropdownItem>
            <DropdownItem key="logout" color="danger">Log Out</DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>
    </Navbar>
  );
}
  return (
    <Navbar>
      <NavbarBrand>
        <AcmeLogo />
        <p className="font-bold text-inherit">ACME</p>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem>
          <Link color="foreground" href="#">
            Features
          </Link>
        </NavbarItem>
        <NavbarItem isActive>
          <Link aria-current="page" color="secondary" href="#">
            Customers
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link color="foreground" href="#">
            Integrations
          </Link>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent as="div" justify="end">
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Avatar
              isBordered
              as="button"
              className="transition-transform"
              color="secondary"
              name="Jason Hughes"
              size="sm"
              src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat">
            <DropdownItem key="profile" className="h-14 gap-2">
              <p className="font-semibold">Signed in as</p>
              <p className="font-semibold">zoey@example.com</p>
            </DropdownItem>
            <DropdownItem key="settings">My Settings</DropdownItem>
            <DropdownItem key="team_settings">Team Settings</DropdownItem>
            <DropdownItem key="analytics">Analytics</DropdownItem>
            <DropdownItem key="system">System</DropdownItem>
            <DropdownItem key="configurations">Configurations</DropdownItem>
            <DropdownItem key="help_and_feedback">Help & Feedback</DropdownItem>
            <DropdownItem key="logout" color="danger">
              Log Out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </NavbarContent>
    </Navbar>
  );
}
