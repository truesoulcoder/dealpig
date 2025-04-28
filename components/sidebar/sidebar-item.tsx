import React from "react";
import { useSidebarContext } from "../layout/layout-context";
import clsx from "clsx";
import NavLink from "../ui/NavLink";

interface Props {
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  href?: string;
}

export const SidebarItem = ({ icon, title, isActive, href = "" }: Props) => {
  const { collapsed, setCollapsed } = useSidebarContext();

  const handleClick = () => {
    if (window.innerWidth < 768) {
      setCollapsed();
    }
  };
  
  return (
    <NavLink
      href={href}
      className="text-default-900 active:bg-none max-w-full"
      onClick={handleClick}
      prefetch={true}
    >
      <div
        className={clsx(
          isActive
            ? "bg-green-400 text-black [&_svg_path]:fill-black"
            : "border border-green-400 text-green-400 hover:bg-green-400 hover:text-black [&_svg_path]:fill-green-400",
          "flex gap-2 w-full min-h-[40px] items-center px-4 py-2 font-mono text-lg rounded-none transition-all duration-150 cursor-pointer"
        )}
      >
        {icon}
        <span>{title}</span>
      </div>
    </NavLink>
  );
};
