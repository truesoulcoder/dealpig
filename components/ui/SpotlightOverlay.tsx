"use client";

import { useEffect, useState } from "react";

export const SpotlightOverlay = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        background: `radial-gradient(
          circle 100px at ${mousePosition.x}px ${mousePosition.y}px,
          transparent 0%,
          rgba(0, 0, 0, 0.95) 100%
        )`,
        backdropFilter: "blur(2px)",
      }}
    />
  );
}; 