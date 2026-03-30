"use client";
import { useEffect, useRef } from "react";

interface IdenticonProps {
  seed: string;
  size?: number;
  className?: string;
}

export default function Identicon({ seed, size = 40, className = "" }: IdenticonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const S = size;
    canvas.width = S;
    canvas.height = S;

    // Generate hash from seed
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Pick background color based on hash
    const h = Math.abs(hash) % 360;
    ctx.fillStyle = `hsl(${h}, 30%, 15%)`;
    ctx.fillRect(0, 0, S, S);

    // Generate 5x5 grid, mirror left to right
    const gridSize = 5;
    const cellSize = S / gridSize;
    const colors = [
      `hsl(${h}, 65%, 50%)`,
      `hsl(${(h + 40) % 360}, 55%, 60%)`,
      `hsl(${(h + 180) % 360}, 45%, 65%)`,
    ];

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col <= Math.floor(gridSize / 2); col++) {
        const bit = (hash >> (row * gridSize + col)) & 1;
        if (bit) {
          const colorIdx = Math.abs((hash >> (row * 5 + col * 2)) % colors.length);
          ctx.fillStyle = colors[colorIdx % colors.length];
          // Left side
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
          // Mirrored right side
          ctx.fillRect((gridSize - 1 - col) * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [seed, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
    />
  );
}
