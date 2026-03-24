import React, { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import SectionWrapper from '../components/SectionWrapper';

export default function MountainAnalogy() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.3 });
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let time = 0;
    let ballProgress = 0;

    // Mountain profile function
    const mountain = (x, w) => {
      const nx = x / w;
      return 0.55
        - 0.35 * Math.exp(-Math.pow((nx - 0.2) / 0.12, 2))
        - 0.45 * Math.exp(-Math.pow((nx - 0.5) / 0.15, 2))
        - 0.25 * Math.exp(-Math.pow((nx - 0.75) / 0.1, 2))
        + 0.05 * Math.sin(nx * 20) * 0.3;
    };

    const draw = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      time += 0.012;

      ctx.clearRect(0, 0, w, h);

      // Sky gradient (dark)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, '#0d0d1a');
      skyGrad.addColorStop(0.4, '#141428');
      skyGrad.addColorStop(1, '#1a1a35');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Stars
      const starSeed = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 0.15, 0.35, 0.6, 0.8, 0.05, 0.45, 0.95, 0.3, 0.65];
      starSeed.forEach((s, i) => {
        const sx = s * w;
        const sy = (((i * 0.137 + 0.1) % 0.4)) * h;
        const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(time * 2 + i));
        ctx.beginPath();
        ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${twinkle * 0.6})`;
        ctx.fill();
      });

      // Mountain layers (back to front)
      const layers = [
        { offset: 0.05, color: 'rgba(20,20,45,0.9)', scale: 0.85 },
        { offset: 0.02, color: 'rgba(25,25,55,0.95)', scale: 0.95 },
        { offset: 0, color: 'rgba(30,30,65,1)', scale: 1.0 },
      ];

      const baseY = h * 0.85;

      layers.forEach(layer => {
        ctx.beginPath();
        ctx.moveTo(0, baseY);
        for (let x = 0; x <= w; x += 2) {
          const my = mountain(x + layer.offset * w * 100, w);
          const py = baseY - my * h * 0.65 * layer.scale;
          ctx.lineTo(x, py);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = layer.color;
        ctx.fill();
      });

      // Mountain surface line
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const my = mountain(x, w);
        const py = baseY - my * h * 0.65;
        if (x === 0) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
      }
      ctx.strokeStyle = 'rgba(99,102,241,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Valley marker (at the lowest point)
      const valleyX = w * 0.5;
      const valleyMY = mountain(valleyX, w);
      const valleyY = baseY - valleyMY * h * 0.65;

      // Valley glow
      const vGrad = ctx.createRadialGradient(valleyX, valleyY, 0, valleyX, valleyY, 40);
      vGrad.addColorStop(0, 'rgba(52,211,153,0.3)');
      vGrad.addColorStop(1, 'rgba(52,211,153,0)');
      ctx.fillStyle = vGrad;
      ctx.beginPath();
      ctx.arc(valleyX, valleyY, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#34d399';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏁 Valley (Minimum)', valleyX, valleyY + 25);

      // Fog effect
      for (let i = 0; i < 6; i++) {
        const fogX = ((time * 30 + i * w / 4) % (w + 200)) - 100;
        const fogY = baseY - (0.2 + i * 0.08) * h * 0.65;
        const fogWidth = 150 + i * 30;

        const fogGrad = ctx.createRadialGradient(fogX, fogY, 0, fogX, fogY, fogWidth / 2);
        fogGrad.addColorStop(0, `rgba(200,200,255,${0.03 + Math.sin(time + i) * 0.01})`);
        fogGrad.addColorStop(1, 'rgba(200,200,255,0)');
        ctx.fillStyle = fogGrad;
        ctx.fillRect(fogX - fogWidth / 2, fogY - fogWidth / 4, fogWidth, fogWidth / 2);
      }

      // Animated ball/person going downhill
      ballProgress += 0.003;
      if (ballProgress > 1) ballProgress = 0;

      // Path: start from left peak, go down to valley
      const startX = w * 0.18;
      const endX = w * 0.5;
      const currentX = startX + (endX - startX) * Math.min(ballProgress * 1.2, 1);
      const currentMY = mountain(currentX, w);
      const currentY = baseY - currentMY * h * 0.65;

      // Ball trail
      ctx.beginPath();
      for (let i = 0; i <= 20; i++) {
        const trailT = Math.max(0, ballProgress * 1.2 - i * 0.015);
        const tx = startX + (endX - startX) * Math.min(trailT, 1);
        const tmy = mountain(tx, w);
        const ty = baseY - tmy * h * 0.65;
        if (i === 0) ctx.moveTo(tx, ty);
        else ctx.lineTo(tx, ty);
      }
      ctx.strokeStyle = 'rgba(251,191,36,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ball glow
      const bGrad = ctx.createRadialGradient(currentX, currentY - 12, 0, currentX, currentY - 12, 24);
      bGrad.addColorStop(0, 'rgba(251,191,36,0.4)');
      bGrad.addColorStop(1, 'rgba(251,191,36,0)');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(currentX, currentY - 12, 24, 0, Math.PI * 2);
      ctx.fill();

      // Person emoji
      ctx.font = '22px serif';
      ctx.textAlign = 'center';
      ctx.fillText('🧑', currentX, currentY - 8);

      // "Can't see!" thought bubble
      if (ballProgress < 0.6) {
        const bubbleX = currentX + 25;
        const bubbleY = currentY - 45;
        ctx.fillStyle = 'rgba(30,30,60,0.85)';
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bubbleX - 50, bubbleY - 12, 100, 24, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '10px Inter, sans-serif';
        ctx.fillText("Can't see ahead! 🌫️", bubbleX, bubbleY + 4);
      }

      // Gradient arrow showing slope direction
      if (ballProgress < 0.95) {
        const dx = 0.5;
        const slopeVal = (mountain(currentX + dx, w) - mountain(currentX - dx, w)) / (2 * dx);
        const arrowLen = 30;
        const angle = Math.atan2(slopeVal * h * 0.65, 1);

        ctx.save();
        ctx.translate(currentX, currentY);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(arrowLen * Math.cos(-angle + Math.PI), arrowLen * Math.sin(-angle + Math.PI) * 0.3);
        ctx.stroke();
        // arrowhead
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        const ax = arrowLen * Math.cos(-angle + Math.PI);
        const ay = arrowLen * Math.sin(-angle + Math.PI) * 0.3;
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - 6, ay - 4);
        ctx.lineTo(ax - 6, ay + 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    if (isInView) {
      draw();
    }
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [isInView]);

  return (
    <SectionWrapper id="mountain-analogy">
      <div ref={containerRef}>
        <span className="section__label">⛰️ Section 3</span>
        <h2 className="section__title">The Mountain Analogy</h2>
        <p className="section__subtitle">
          Imagine you're standing on a mountain in thick fog. You can't see the
          bottom, but you can feel which way the ground slopes. You take small
          steps downhill — that's Gradient Descent!
        </p>

        <motion.div
          className="viz-container"
          style={{ height: 420 }}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
        >
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        </motion.div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { emoji: '🌫️', title: 'Fog', desc: "You can't see the whole landscape" },
            { emoji: '📐', title: 'Check Slope', desc: 'Feel the ground beneath your feet' },
            { emoji: '👣', title: 'Step Downhill', desc: 'Move in the steepest downward direction' },
            { emoji: '🔁', title: 'Repeat', desc: 'Keep stepping until you reach the valley' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              className="card"
              style={{ flex: '1', minWidth: 140, textAlign: 'center' }}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5 + i * 0.15 }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{item.emoji}</div>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{item.title}</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
