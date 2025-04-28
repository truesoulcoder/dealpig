'use client';
import React, { useEffect, useState } from 'react';
import '../../styles/dealpig-animation.css';

interface AnimatedDealpigProps {
  width?: string;
  height?: string;
  className?: string;
}

export const AnimatedDealpig: React.FC<AnimatedDealpigProps> = ({
  width = '100%',
  height = '100%',
  className = ''
}) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);

  useEffect(() => {
    // Use fetch with text() instead of json() to avoid JSON parsing errors
    fetch('/logo-animation/dealpig.svg')
      .then(response => response.text()) // Parse as text, not JSON
      .then(data => {
        setSvgContent(data);
      })
      .catch(error => {
        console.error("Error loading SVG:", error);
      });
  }, []);

  return (
    <div
      className={`animated-dealpig-container ${className}`}
      style={{ width, height }}
      dangerouslySetInnerHTML={{ __html: svgContent || '' }}
    />
  );
};