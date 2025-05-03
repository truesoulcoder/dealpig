import React, { useEffect, useRef } from 'react';

const MONEY_SYMBOLS = ['$', '₿', '€', '¥', '£', '¢', '₹'];
const COLORS = ['#10b981', '#22d3ee', '#fbbf24', '#a3e635', '#f472b6', '#facc15'];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function FallingMoney({ count = 24, style = {}, className = '' }: { count?: number; style?: React.CSSProperties; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const nodes: HTMLSpanElement[] = [];
    for (let i = 0; i < count; i++) {
      const symbol = MONEY_SYMBOLS[Math.floor(Math.random() * MONEY_SYMBOLS.length)];
      const span = document.createElement('span');
      span.textContent = symbol;
      span.style.position = 'absolute';
      span.style.left = `${randomBetween(0, 100)}%`;
      span.style.top = `-${randomBetween(5, 30)}px`;
      span.style.fontSize = `${randomBetween(1.2, 2.6)}rem`;
      span.style.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      span.style.opacity = String(randomBetween(0.6, 0.98));
      span.style.filter = 'blur(0.5px)';
      span.style.pointerEvents = 'none';
      span.style.userSelect = 'none';
      span.style.fontWeight = 'bold';
      span.style.transition = 'none';
      span.style.zIndex = '1';
      // Animate
      const duration = randomBetween(2.8, 5.5);
      span.animate([
        { transform: `translateY(0px) rotate(${randomBetween(-8, 8)}deg)` },
        { transform: `translateY(110vh) rotate(${randomBetween(-24, 24)}deg)` }
      ], {
        duration: duration * 1000,
        delay: randomBetween(0, 2000),
        iterations: Infinity,
        easing: 'linear',
      });
      container.appendChild(span);
      nodes.push(span);
    }
    return () => {
      nodes.forEach(n => n.remove());
    };
  }, [count]);

  return <div ref={containerRef} className={className} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...style }} aria-hidden />;
}
