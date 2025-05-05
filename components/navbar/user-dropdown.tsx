import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import User from "../User";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAuthCookie } from "@/actions/auth.action";
import { ThemeToggle } from "./theme-toggle";

export const UserDropdown = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await deleteAuthCookie();
      window.location.href = '/login';
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center">
      <Dropdown>
        <DropdownTrigger>
          <User size="sm" className="transition-transform cursor-pointer" />
        </DropdownTrigger>
        <DropdownMenu
          aria-label="User menu actions"
          className="bg-black border border-green-400 rounded-none"
        >
          <DropdownItem 
            key="settings" 
            className="text-green-400 hover:bg-green-400 hover:text-black font-mono"
          >
            Settings
          </DropdownItem>
          <DropdownItem 
            key="logout"
            className="text-green-400 hover:bg-green-400 hover:text-black font-mono"
            onPress={handleLogout}
          >
            Log Out
          </DropdownItem>
          <DropdownItem key="theme" className="text-green-400 hover:bg-green-400 hover:text-black font-mono">
            <ThemeToggle />
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};
