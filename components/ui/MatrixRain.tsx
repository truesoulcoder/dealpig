'use client';

import React, { useRef, useEffect, useState } from 'react';

interface MatrixRainProps {
  isVisible: boolean;
}

const MatrixRain: React.FC<MatrixRainProps> = ({ isVisible }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRendered, setIsRendered] = useState(isVisible);

  // Keep the component rendered during fade-out
  useEffect(() => {
    if (isVisible) {
      setIsRendered(true);
    } else {
      // Start fade-out, then unmount after transition
      const timer = setTimeout(() => setIsRendered(false), 500); // Match transition duration
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  useEffect(() => {
    if (!isRendered) return; // Only run effect if rendered

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const columns = Math.floor(width / 20); // Number of columns based on font size
    const yPositions = Array(columns).fill(0);

    // Characters to use - Katakana + numbers + symbols
    const characters = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    let animationFrameId: number;

    const draw = () => {
      // Semi-transparent black background for fading effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#0F0'; // Green text
      ctx.font = '15pt monospace';

      yPositions.forEach((y, index) => {
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        const x = index * 20;
        ctx.fillText(text, x, y);

        // Move character down or reset if it goes off screen
        if (y > height + Math.random() * 10000) {
          yPositions[index] = 0;
        } else {
          yPositions[index] = y + 20;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      cancelAnimationFrame(animationFrameId);
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      // Recalculate columns and reset positions if needed
      const newColumns = Math.floor(width / 20);
      yPositions.length = 0; // Clear old array
      yPositions.push(...Array(newColumns).fill(0)); // Fill with new size
      draw(); // Restart animation
    };

    window.addEventListener('resize', handleResize);
    draw(); // Start the animation

    // Cleanup function
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isRendered]); // Rerun effect if isRendered changes

  if (!isRendered) {
    return null; // Don't render canvas if not visible or faded out
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: isVisible ? 1 : 0, // Control fade with opacity
        transition: 'opacity 0.5s ease-in-out', // Add fade transition
        backgroundColor: 'black', // Ensure background is black during fade
      }}
    />
  );
};

export default MatrixRain;
