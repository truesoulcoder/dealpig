import React from "react";
import { Sidebar } from "./sidebar.styles";
import { Avatar, Tooltip } from "@heroui/react";
import { CompaniesDropdown } from "./companies-dropdown";
import { HomeIcon } from "../icons/sidebar/home-icon";
import { PaymentsIcon } from "../icons/sidebar/payments-icon";
import { BalanceIcon } from "../icons/sidebar/balance-icon";
import { AccountsIcon } from "../icons/sidebar/accounts-icon";
import { CustomersIcon } from "../icons/sidebar/customers-icon";
import { ProductsIcon } from "../icons/sidebar/products-icon";
import { ReportsIcon } from "../icons/sidebar/reports-icon";
import { DevIcon } from "../icons/sidebar/dev-icon";
import { ViewIcon } from "../icons/sidebar/view-icon";
import { SettingsIcon } from "../icons/sidebar/settings-icon";
import { CollapseItems } from "./collapse-items";
import { SidebarItem } from "./sidebar-item";
import { SidebarMenu } from "./sidebar-menu";
import { FilterIcon } from "../icons/sidebar/filter-icon";
import { useSidebarContext } from "../layout/layout-context";
import { ChangeLogIcon } from "../icons/sidebar/changelog-icon";
import { usePathname } from "next/navigation";

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
      >
        <div className={Sidebar.Header()}>
          <CompaniesDropdown />
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
                title="Gmail Accounts"
                icon={<AccountsIcon />}
                href="/accounts"
              />
              <SidebarItem
                isActive={pathname.includes("/leads")}
                title="Leads"
                icon={<CustomersIcon />}
                href="/leads"
              />
              <SidebarItem
                isActive={pathname.includes("/campaigns")}
                title="Campaigns"
                icon={<ProductsIcon />}
                href="/campaigns"
              />
              <SidebarItem
                isActive={pathname.includes("/advanced-table")}
                title="Advanced Table"
                icon={<BalanceIcon />}
                href="/advanced-table"
              />
            </SidebarMenu>

            {/* Reserved section for future features - these items will be commented out until the pages are implemented */}
            {/* 
            <SidebarMenu title="Control Panel">
              <SidebarItem
                isActive={pathname.includes("/templates")}
                title="Edit Templates"
                icon={<DevIcon />}
                href="/templates"
              />
              <SidebarItem
                isActive={pathname.includes("/import-leads")}
                title="Upload Leads"
                icon={<ViewIcon />}
                href="/import-leads"
              />
              <SidebarItem
                isActive={pathname.includes("/settings")}
                title="Campaign Settings"
                icon={<SettingsIcon />}
                href="/settings"
              />
              <SidebarItem
                isActive={pathname.includes("/reports")}
                title="Campaign Reports"
                icon={<ReportsIcon />}
                href="/reports"
              />
            </SidebarMenu>
            */}
          </div>
          <div className={Sidebar.Footer()}>
            <Tooltip content={"Settings"} color="primary">
              <div className="max-w-fit">
                <SettingsIcon />
              </div>
            </Tooltip>
            <Tooltip content={"Adjustments"} color="primary">
              <div className="max-w-fit">
                <FilterIcon />
              </div>
            </Tooltip>
            <Tooltip content={"Profile"} color="primary">
              <Avatar
                src="https://i.pravatar.cc/150?u=a042581f4e29026704d"
                size="sm"
              />
            </Tooltip>
          </div>
        </div>
      </div>
    </aside>
  );
};
