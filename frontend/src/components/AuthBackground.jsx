import React, { useEffect, useRef } from 'react';

/**
 * Animated background for auth pages: a slowly drifting network of nodes
 * (evoking linked evidence/case data) with a periodic horizontal scan
 * sweep, echoing a forensic scanner pass. Built on canvas rather than a
 * generic particle library so it stays lightweight and on-theme.
 */
export default function AuthBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width, height, dpr;
    let nodes = [];
    let scanY = -100;
    let animationId;

    const NODE_COUNT = 42;
    const LINK_DIST = 130;
    const NODE_COLOR = '107, 102, 90'; // faint kraft-paper text tone
    const LINK_COLOR = '74, 69, 60';
    const ACCENT_LINK = '79, 163, 168'; // verified cyan, used sparingly

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initNodes() {
      nodes = Array.from({ length: NODE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.4 + 0.8,
        accent: Math.random() < 0.08, // a few nodes glow cyan, like flagged evidence
      }));
    }

    function step() {
      ctx.clearRect(0, 0, width, height);

      // drift nodes
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width) n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
      }

      // links between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            const opacity = (1 - dist / LINK_DIST) * 0.35;
            const useAccent = a.accent && b.accent;
            ctx.strokeStyle = `rgba(${useAccent ? ACCENT_LINK : LINK_COLOR}, ${opacity})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // nodes themselves
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.accent ? 'rgba(79, 163, 168, 0.55)' : `rgba(${NODE_COLOR}, 0.45)`;
        ctx.fill();
      }

      // scan sweep: a soft horizontal band drifting down, looping
      const sweepHeight = 140;
      const gradient = ctx.createLinearGradient(0, scanY - sweepHeight, 0, scanY + sweepHeight);
      gradient.addColorStop(0, 'rgba(79, 163, 168, 0)');
      gradient.addColorStop(0.5, 'rgba(79, 163, 168, 0.05)');
      gradient.addColorStop(1, 'rgba(79, 163, 168, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanY - sweepHeight, width, sweepHeight * 2);

      // thin leading scan line
      ctx.strokeStyle = 'rgba(79, 163, 168, 0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(width, scanY);
      ctx.stroke();

      scanY += 0.45;
      if (scanY > height + sweepHeight) scanY = -sweepHeight;

      animationId = requestAnimationFrame(step);
    }

    resize();
    initNodes();

    if (prefersReducedMotion) {
      // draw a single static frame: nodes and links, no sweep, no loop
      step_static();
    } else {
      step();
    }

    function step_static() {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            const opacity = (1 - dist / LINK_DIST) * 0.3;
            ctx.strokeStyle = `rgba(${LINK_COLOR}, ${opacity})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${NODE_COLOR}, 0.4)`;
        ctx.fill();
      }
    }

    const handleResize = () => {
      resize();
      initNodes();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="auth-bg-canvas" aria-hidden="true" />;
}