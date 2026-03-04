import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

const GOLD_COLORS = ["#C9A84C", "#E5C97E", "#D4B85C", "#B8962F", "#F0D78C"];

export function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number | null>(null);

  const createCanvas = useCallback(() => {
    if (canvasRef.current) return canvasRef.current;
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;inset:0;z-index:9999;pointer-events:none;";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    canvasRef.current = canvas;
    return canvas;
  }, []);

  const fire = useCallback(() => {
    const canvas = createCanvas();
    const ctx = canvas.getContext("2d")!;
    const particles: Particle[] = [];

    // Spawn particles from top center area
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 300,
        y: -10,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 4 + 2,
        life: 0,
        maxLife: 60 + Math.random() * 40,
        size: Math.random() * 6 + 2,
        color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
      });
    }

    particlesRef.current = particles;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      for (const p of particlesRef.current) {
        p.life++;
        if (p.life > p.maxLife) continue;
        alive = true;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1; // gravity
        p.vx *= 0.99;

        const alpha = 1 - p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size * 0.6);
      }

      ctx.globalAlpha = 1;

      if (alive) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        canvas.remove();
        canvasRef.current = null;
      }
    };

    animate();
  }, [createCanvas]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      if (canvasRef.current) canvasRef.current.remove();
    };
  }, []);

  return fire;
}
