import React, { useEffect, useRef } from "react";

interface Sparkle {
  x: number;
  y: number;
  size: number;
  baseSize: number;
  speedY: number;
  speedX: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

export default function LivingBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let sparkles: Sparkle[] = [];
    const maxSparkles = 40; // Maintain minimal density for strict premium minimalism

    const resizeCanvas = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initSparkles();
    };

    const initSparkles = () => {
      sparkles = [];
      for (let i = 0; i < maxSparkles; i++) {
        const size = Math.random() * 1.5 + 0.5; // Tiny
        sparkles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: size,
          baseSize: size,
          speedY: -(Math.random() * 0.12 + 0.03), // Extremely slow drifts upward
          speedX: (Math.random() * 0.06 - 0.03), // Subtle side-drift
          opacity: Math.random() * 0.35 + 0.1, // Soft, low-contrast
          twinkleSpeed: Math.random() * 0.015 + 0.005,
          twinkleOffset: Math.random() * Math.PI * 2,
        });
      }
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Render star clusters or sparkles
      for (let i = 0; i < sparkles.length; i++) {
        const s = sparkles[i];

        // Apply physics
        s.y += s.speedY;
        s.x += s.speedX;

        // Wrap around screen edge bounds
        if (s.y < 0) {
          s.y = canvas.height;
          s.x = Math.random() * canvas.width;
        }
        if (s.x < 0) s.x = canvas.width;
        if (s.x > canvas.width) s.x = 0;

        // Sparkle / Twinkle calculation
        const currentOpacity = s.opacity * (0.4 + 0.6 * Math.sin(time * s.twinkleSpeed + s.twinkleOffset));
        
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 160, 255, ${currentOpacity})`; // Violet subtle tint
        ctx.fill();

        // Bloom ring for a subset of wider sparkles
        if (i % 6 === 0) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(139, 92, 246, ${currentOpacity * 0.15})`; // Soft halo
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Primary HTML5 Canvas Particle system */}
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
      
      {/* Ambient Radial Gradient Glows */}
      <div className="absolute top-[20%] left-[15%] w-[45vw] h-[45vw] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none animate-bloom-glow" />
      <div className="absolute bottom-[25%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/5 blur-[140px] pointer-events-none animate-bloom-glow" style={{ animationDelay: "-3s" }} />
      <div className="absolute top-[60%] left-[50%] -translate-x-1/2 w-[35vw] h-[35vw] rounded-full bg-[#8B5CF6]/3 blur-[110px] pointer-events-none animate-bloom-glow" style={{ animationDelay: "-6s" }} />
    </div>
  );
}
