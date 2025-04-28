import React from "react";
import { Sidebar } from "./sidebar.styles";
import { HomeIcon } from "../icons/sidebar/home-icon";
import { AccountsIcon } from "../icons/sidebar/accounts-icon";
import { CustomersIcon } from "../icons/sidebar/customers-icon";
import { ProductsIcon } from "../icons/sidebar/products-icon";
import { DevIcon } from "../icons/sidebar/dev-icon";
import { SidebarItem } from "./sidebar-item";
import { SidebarMenu } from "./sidebar-menu";
import { useSidebarContext } from "../layout/layout-context";
import { usePathname } from "next/navigation";
import { AnimatedDealpig } from "../icons/AnimatedDealpig";
import { AnimatedDealpigText } from "../icons/AnimatedDealpigText";
import { ReportsIcon } from "../icons/sidebar/reports-icon";

export const SidebarWrapper = () => {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebarContext();

  return (
    <aside className="h-screen z-[20] sticky top-0">
      {collapsed ? (
        <div className={Sidebar.Overlay()} onClick={setCollapsed} />
      ) : null}
      <div
        className={Sidebar({
          collapsed: collapsed,
        })}
>       <div className={Sidebar.Header()}>
          {/* Replace static Image with AnimatedDealpig component */}
          <div className="relative w-full h-full flex items-center justify-center">
            <AnimatedDealpig />
          </div>
        </div>
        <div>
          {/* Replace static Image with AnimatedDealpigText component */}
          <div className="relative w-full h-full flex items-center justify-center">
            <AnimatedDealpigText />
          </div>
        </div>
        <div className="flex flex-col justify-between h-full">
          <div className={Sidebar.Body()}>
            <SidebarItem
              title="Home"
              icon={<HomeIcon />}
              isActive={pathname === "/" || pathname === "/home"}
              href="/"
            />
            <SidebarMenu title="Main Menu">
              <SidebarItem
                isActive={pathname.includes("/accounts")}
                title="Accounts"
                icon={<AccountsIcon />}
                href="/accounts"
              />
              <SidebarItem
                isActive={pathname.includes("/leads")}
                title="Leads"
                icon={<ReportsIcon />}
                href="/leads"
              />
              <SidebarItem
                isActive={pathname.includes("/campaigns")}
                title="Campaigns"
                icon={<ProductsIcon />}
                href="/campaigns"
              />
              <SidebarItem
                isActive={pathname.includes("/templates")}
                title="Templates"
                icon={<DevIcon />}
                href="/templates"
              />
            </SidebarMenu>
          </div>
        </div>
      </div>
    </aside>
  );
};
