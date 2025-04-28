import { tv } from "@heroui/react";

export const SidebarWrapper = tv({
  base: "bg-background transition-transform h-full fixed -translate-x-full w-64 shrink-0 z-[202] border-r border-divider flex-col py-6 px-3 md:ml-0 md:flex md:static md:h-screen md:translate-x-0 ",

  variants: {
    collapsed: {
      true: "translate-x-0 ml-0 pt-20 [display:inherit]",
    },
  },
});

export const Overlay = tv({
  base: "bg-[rgb(15_23_42/0.3)] fixed inset-0 z-[201] opacity-80 transition-opacity md:hidden md:z-auto md:opacity-100",
});

export const Header = tv({
  base: "flex justify-center items-center w-full",
});

export const Subtitle = tv({
  base: "flex justify-center items-center w-full",
});

export const Body = tv({
  base: "flex flex-col gap-1 mt-2 px-2",
});

export const Footer = tv({
  base: "flex justify-center items-center w-full",
});

export const Sidebar = Object.assign(SidebarWrapper, {
  Header,
  Body,
  Overlay,
  Footer,
});
