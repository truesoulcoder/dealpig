'use client';
import React, { useEffect, useState } from 'react';
import '../../styles/dealpigtext-animation.css';

interface AnimatedDealpigTextProps {
  width?: string;
  height?: string;
  className?: string;
}

export const DealpigText: React.FC<AnimatedDealpigTextProps> = ({
  width = '80%',
  height = '80%',
  className = 'DealpigText'
}) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);

  useEffect(() => {
    // Use fetch with text() instead of json() to avoid JSON parsing errors
    fetch('/logo-animation/dealpigtext.svg')
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
      className={`animated-dealpigtext-container ${className}`}
      style={{ width, height }}
      dangerouslySetInnerHTML={{ __html: svgContent || '' }}
    />
  );
};