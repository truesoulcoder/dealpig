"use client";

import React, { useEffect } from "react";
import { useLockedBody } from "../hooks/useBodyLock";
import { NavbarWrapper } from "../navbar/navbar";
import { SidebarWrapper } from "../sidebar/sidebar";
import { SidebarContext } from "./layout-context";
import { useRouter } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

export const Layout = ({ children }: Props) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [_, setLocked] = useLockedBody(false);
  const router = useRouter();

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    setLocked(!sidebarOpen);
  };

  // Reset sidebar state on route change to avoid interference with routing
  useEffect(() => {
    const handleRouteChange = () => {
      if (sidebarOpen && window.innerWidth < 768) {
        setSidebarOpen(false);
        setLocked(false);
      }
    };

    // Create a MutationObserver to detect DOM changes that might indicate a route change
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          handleRouteChange();
        }
      });
    });

    // Start observing the document body for DOM changes
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [sidebarOpen, setLocked]);

  return (
    <SidebarContext.Provider
      value={{
        collapsed: sidebarOpen,
        setCollapsed: handleToggleSidebar,
      }}>
      <section className='flex'>
        <SidebarWrapper />
        <NavbarWrapper>{children}</NavbarWrapper>
      </section>
    </SidebarContext.Provider>
  );
};
