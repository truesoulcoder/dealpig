"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface AnimatedLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ 
  width = 120, 
  height = 88,
  className = "" 
}) => {
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    // Set active state on mount to start the animation
    setIsActive(true);
  }, []);

  return (
    <div className={`logo-animation-container ${className}`}>
      <object
        type="image/svg+xml"
        data="/dealpig.svg"
        width={width}
        height={height}
        className={isActive ? "active" : ""}
        aria-label="DealPig Logo"
      />
    </div>
  );
};