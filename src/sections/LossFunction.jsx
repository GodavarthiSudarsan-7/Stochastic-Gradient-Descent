import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import SectionWrapper from '../components/SectionWrapper';

export default function LossFunction() {
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
    let t = 0; // parameter for ball position
    const speed = 0.004;

    // Loss function: L(w) = (w - 3)^2 + 0.5*sin(2w) + 2
    const lossFn = (w) => Math.pow(w - 3, 2) + 0.5 * Math.sin(2 * w) + 2;

    const draw = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      time += 0.015;

      ctx.clearRect(0, 0, w, h);

      const pad = { top: 50, right: 40, bottom: 60, left: 70 };
      const plotW = w - pad.left - pad.right;
      const plotH = h - pad.top - pad.bottom;

      const wMin = -1, wMax = 7, lMin = 0, lMax = 20;
      const sx = (v) => pad.left + ((v - wMin) / (wMax - wMin)) * plotW;
      const sy = (v) => pad.top + plotH - ((v - lMin) / (lMax - lMin)) * plotH;

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const yv = lMin + (i / 5) * (lMax - lMin);
        ctx.beginPath(); ctx.moveTo(pad.left, sy(yv)); ctx.lineTo(w - pad.right, sy(yv)); ctx.stroke();
      }

      // Loss curve - draw with gradient
      ctx.beginPath();
      const steps = 200;
      for (let i = 0; i <= steps; i++) {
        const wVal = wMin + (i / steps) * (wMax - wMin);
        const lVal = lossFn(wVal);
        const px = sx(wVal);
        const py = sy(lVal);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      const grad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
      grad.addColorStop(0, 'rgba(248,113,113,0.8)');
      grad.addColorStop(0.5, 'rgba(251,191,36,0.8)');
      grad.addColorStop(1, 'rgba(52,211,153,0.8)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Fill under curve
      ctx.lineTo(sx(wMax), sy(lMin));
      ctx.lineTo(sx(wMin), sy(lMin));
      ctx.closePath();
      const fillGrad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
      fillGrad.addColorStop(0, 'rgba(248,113,113,0.05)');
      fillGrad.addColorStop(1, 'rgba(52,211,153,0.08)');
      ctx.fillStyle = fillGrad;
      ctx.fill();

      // Minimum marker
      const minW = 3.0;
      const minL = lossFn(minW);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(52,211,153,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx(minW), sy(minL));
      ctx.lineTo(sx(minW), sy(lMin));
      ctx.stroke();
      ctx.setLineDash([]);

      // Minimum label
      ctx.fillStyle = '#34d399';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✓ Minimum Loss', sx(minW), sy(minL) + 30);

      // Animated ball
      t += speed;
      if (t > 1) t = 0;

      // Ball traces a smooth path exploring the curve
      const ballW = wMin + 0.5 + (wMax - wMin - 1) * (0.5 + 0.5 * Math.sin(time * 0.5));
      const ballL = lossFn(ballW);

      // Trail
      ctx.beginPath();
      for (let i = 0; i < 20; i++) {
        const tt = time * 0.5 - i * 0.05;
        const bw = wMin + 0.5 + (wMax - wMin - 1) * (0.5 + 0.5 * Math.sin(tt));
        const bl = lossFn(bw);
        if (i === 0) ctx.moveTo(sx(bw), sy(bl));
        else ctx.lineTo(sx(bw), sy(bl));
      }
      ctx.strokeStyle = `rgba(99,102,241,0.2)`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ball glow
      const ballGrad = ctx.createRadialGradient(sx(ballW), sy(ballL), 0, sx(ballW), sy(ballL), 20);
      ballGrad.addColorStop(0, 'rgba(99,102,241,0.4)');
      ballGrad.addColorStop(1, 'rgba(99,102,241,0)');
      ctx.fillStyle = ballGrad;
      ctx.fillRect(sx(ballW) - 20, sy(ballL) - 20, 40, 40);

      // Ball
      ctx.beginPath();
      ctx.arc(sx(ballW), sy(ballL), 8, 0, Math.PI * 2);
      ctx.fillStyle = '#6366f1';
      ctx.fill();
      ctx.strokeStyle = 'rgba(99,102,241,0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Current loss label
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Loss: ${ballL.toFixed(2)}`, sx(ballW) + 14, sy(ballL) - 5);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(`w: ${ballW.toFixed(2)}`, sx(ballW) + 14, sy(ballL) + 10);

      // Axis labels
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Model Parameter (w)', w / 2, h - 10);
      ctx.save();
      ctx.translate(16, h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Loss (Error)', 0, 0);
      ctx.restore();

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
    <SectionWrapper id="loss-function">
      <div ref={containerRef}>
        <span className="section__label">📉 Section 2</span>
        <h2 className="section__title">The Loss Function</h2>
        <p className="section__subtitle">
          A loss function measures how wrong our model is. Think of it as a
          landscape where every position represents a different model setting,
          and the height tells you how bad the predictions are.
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

        <div className="legend" style={{ justifyContent: 'center', marginTop: '1rem' }}>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#6366f1' }}></div>
            <span>Current position on the loss curve</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#34d399' }}></div>
            <span>Target: the minimum loss</span>
          </div>
        </div>

        <motion.div
          className="card"
          style={{ marginTop: '1.5rem', textAlign: 'center', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto' }}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
        >
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            🎯 <strong style={{ color: 'var(--text-primary)' }}>Goal:</strong> Find the parameter value
            that gives us the <span style={{ color: '#34d399' }}>lowest point</span> on this curve — that's where
            our model makes the least errors!
          </p>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
