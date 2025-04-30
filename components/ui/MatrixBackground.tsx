"use client";

import React, { useEffect, useRef, useState } from 'react';
import styles from './MatrixBackground.module.scss';

export const MatrixBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Matrix characters (expanded set for more variety)
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'.split('');
    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = new Array(columns).fill(0);

    // Animation frame
    let animationFrame: number;

    const draw = () => {
      // Semi-transparent black background for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the characters
      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Base color with higher opacity
        ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
        ctx.font = `${fontSize}px "Courier New", monospace`;
        ctx.fillText(char, x, y);

        // Add a subtle glow effect
        ctx.shadowColor = '#10B981';
        ctx.shadowBlur = 5;
        ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.fillText(char, x, y);

        // Reset shadow
        ctx.shadowBlur = 0;

        // Reset when off screen or randomly
        if (y > canvas.height || Math.random() > 0.98) {
          drops[i] = 0;
        } else {
          drops[i]++;
        }
      }

      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={styles.matrixCanvas}
      style={{ 
        width: dimensions.width,
        height: dimensions.height
      }}
    />
  );
}; 