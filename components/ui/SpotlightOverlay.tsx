"use client";

import { useEffect, useState } from "react";

export const SpotlightOverlay = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseenter", handleMouseEnter);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseenter", handleMouseEnter);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none transition-all duration-300"
      style={{
        background: `radial-gradient(
          circle ${isHovering ? '400px' : '350px'} at ${mousePosition.x}px ${mousePosition.y}px,
          transparent 0%,
          rgba(0, 0, 0, 0.5) 100%
        )`,
        backdropFilter: "blur(3px)",
        opacity: isHovering ? 1 : 0.8,
      }}
    />
  );
}; 