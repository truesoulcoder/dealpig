'use client';

import React, { useRef, useEffect } from 'react';

const MatrixRain: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const columns = Math.floor(width / 20); // Number of columns based on font size
    const yPositions = Array(columns).fill(0);

    // Characters to use - office set + envelopes
    const characters = '🖹🗅🗆🗇🗈🗉🗊🗋🗌🗍🗎🗏🗐🖂🖃🖄🖅🖆✉';

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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1, // Position behind other content
        pointerEvents: 'none', // Allow clicks to pass through
        // Consider adding background color if needed, e.g., backgroundColor: 'black'
      }}
    />
  );
};

export default MatrixRain;
