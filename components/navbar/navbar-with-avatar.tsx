"use client";

import {
  Navbar,
  NavbarBrand,
  NavbarContent,
} from "@heroui/react";
import { useTheme } from "../ui/theme-context";
import User from "../User";
import { Icon } from "@iconify/react";
import { useState } from "react";

function MobileNavbarMenu({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div
      className={`fixed top-0 left-0 w-64 h-full z-50 bg-background shadow-lg transform transition-transform duration-300 md:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}
      style={{ minHeight: '100vh' }}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <span className="font-bold">Menu</span>
        <button onClick={() => setOpen(false)} aria-label="Close menu">
          <Icon icon="mdi:close" width={28} height={28} />
        </button>
      </div>
      <div className="p-4 flex flex-col gap-4">
        <button
          className={`px-4 py-1 rounded ${theme === 'heroui' ? 'bg-primary-600 text-white' : 'bg-default-100'}`}
          onClick={() => { if (theme !== 'heroui') toggleTheme(); setOpen(false); }}
        >
          Dark Theme
        </button>
        <button
          className={`px-4 py-1 rounded ${theme === 'leet' ? 'bg-green-500 text-black' : 'bg-default-100'}`}
          onClick={() => { if (theme !== 'leet') toggleTheme(); setOpen(false); }}
        >
          L33T Theme
        </button>
        <div className="mt-4">
          {/* Temporarily removed Dropdown with User */}
          <div className="p-2 rounded bg-default-100">User Placeholder</div>
        </div>
      </div>
    </div>
  );
}

export default function NavbarWithAvatar() {
  const { theme, toggleTheme } = useTheme();
  const [burgerOpen, setBurgerOpen] = useState(false);

  return (
    <>
      {/* Mobile Navbar */}
      <nav className="block md:hidden">
        <Navbar>
          <NavbarBrand>
            <button
              aria-label="Open menu"
              className="mr-2 p-2 rounded hover:bg-default-100 focus:outline-none"
              onClick={() => setBurgerOpen(true)}
            >
              <Icon icon="mdi:menu" width={28} height={28} />
            </button>
          </NavbarBrand>
        </Navbar>
        <MobileNavbarMenu open={burgerOpen} setOpen={setBurgerOpen} />
      </nav>

      {/* Desktop Navbar */}
      <nav className="hidden md:block">
        <Navbar>
          <NavbarContent className="flex gap-4" justify="center">
            {/* Temporarily removed NavbarItems with buttons */}
            <div className="px-4 py-1 rounded bg-default-100">Dark Theme Placeholder</div>
            <div className="px-4 py-1 rounded bg-default-100">L33T Theme Placeholder</div>
          </NavbarContent>
          <NavbarContent as="div" justify="end">
            {/* Temporarily removed Dropdown with User */}
            <div className="p-2 rounded bg-default-100">User Placeholder</div>
          </NavbarContent>
        </Navbar>
      </nav>
    </>
  );
}

export { NavbarWithAvatar };
