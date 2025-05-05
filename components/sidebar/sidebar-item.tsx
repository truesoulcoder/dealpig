import { LetterFx } from '../ui/LetterFx';
import React from "react";
import { useSidebarContext } from "../layout/layout-context";
import NavLink from "../ui/NavLink";
import { Button } from "@heroui/react";

interface Props {
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  href?: string;
}

export const SidebarItem = ({ icon, title, isActive, href = '' }: Props) => {
  const { collapsed, setCollapsed } = useSidebarContext();

  const handleClick = () => {
    if (window.innerWidth < 768) {
      setCollapsed();
    }
  };

  const content = (
    <Button
      variant={isActive ? "flat" : "ghost"}
      color="primary"
      onPress={handleClick}
      startContent={icon}
      className="w-full justify-start font-mono text-lg"
    >
      <LetterFx trigger="hover" speed="slow">
        {title}
      </LetterFx>
    </Button>
  );

  return (
    <NavLink href={href} prefetch>
      {content}
    </NavLink>
  );
};
