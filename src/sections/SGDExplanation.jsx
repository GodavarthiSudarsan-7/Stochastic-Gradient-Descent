import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import SectionWrapper from '../components/SectionWrapper';

export default function SGDExplanation() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.3 });
  const animRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);

  // 2D loss function for contour: f(x,y) = x^2 + 2*y^2 + sin(x)*cos(y)
  const lossFn = (x, y) => x * x + 2 * y * y + Math.sin(x) * Math.cos(y) + 5;
  const gradFn = (x, y) => {
    const eps = 0.01;
    const dx = (lossFn(x + eps, y) - lossFn(x - eps, y)) / (2 * eps);
    const dy = (lossFn(x, y + eps) - lossFn(x, y - eps)) / (2 * eps);
    return [dx, dy];
  };

  const batchState = useRef({ x: 3, y: 2.5, history: [] });
  const sgdState = useRef({ x: 3, y: 2.5, history: [] });

  const resetStates = useCallback(() => {
    batchState.current = { x: 3, y: 2.5, history: [{ x: 3, y: 2.5 }] };
    sgdState.current = { x: 3, y: 2.5, history: [{ x: 3, y: 2.5 }] };
    setIsRunning(false);
  }, []);

  useEffect(() => {
    resetStates();
  }, []);

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

    const lr = 0.05;
    let frameCount = 0;

    const draw = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      frameCount++;

      // Step both methods
      if (isRunning && frameCount % 6 === 0) {
        // Batch GD: perfect gradient
        const bs = batchState.current;
        const [bdx, bdy] = gradFn(bs.x, bs.y);
        bs.x -= lr * bdx;
        bs.y -= lr * bdy;
        bs.history.push({ x: bs.x, y: bs.y });
        if (bs.history.length > 500) bs.history.shift();

        // SGD: noisy gradient
        const ss = sgdState.current;
        const [sdx, sdy] = gradFn(ss.x, ss.y);
        const noise = 1.5;
        ss.x -= lr * (sdx + (Math.random() - 0.5) * noise);
        ss.y -= lr * (sdy + (Math.random() - 0.5) * noise);
        ss.history.push({ x: ss.x, y: ss.y });
        if (ss.history.length > 500) ss.history.shift();
      }

      ctx.clearRect(0, 0, w, h);

      // Contour map
      const pad = { top: 20, right: 20, bottom: 20, left: 20 };
      const plotW = w - pad.left - pad.right;
      const plotH = h - pad.top - pad.bottom;

      const rangeX = [-4, 4];
      const rangeY = [-3, 3];
      const sx = (v) => pad.left + ((v - rangeX[0]) / (rangeX[1] - rangeX[0])) * plotW;
      const sy = (v) => pad.top + ((v - rangeY[0]) / (rangeY[1] - rangeY[0])) * plotH;

      // Draw contour as pixel data
      const imgData = ctx.createImageData(Math.floor(plotW), Math.floor(plotH));
      let minL = Infinity, maxL = -Infinity;

      // Pre-compute min/max
      for (let py = 0; py < Math.floor(plotH); py += 4) {
        for (let px = 0; px < Math.floor(plotW); px += 4) {
          const xv = rangeX[0] + (px / plotW) * (rangeX[1] - rangeX[0]);
          const yv = rangeY[0] + (py / plotH) * (rangeY[1] - rangeY[0]);
          const l = lossFn(xv, yv);
          if (l < minL) minL = l;
          if (l > maxL) maxL = l;
        }
      }

      for (let py = 0; py < Math.floor(plotH); py++) {
        for (let px = 0; px < Math.floor(plotW); px++) {
          const xv = rangeX[0] + (px / plotW) * (rangeX[1] - rangeX[0]);
          const yv = rangeY[0] + (py / plotH) * (rangeY[1] - rangeY[0]);
          const l = lossFn(xv, yv);
          const t = Math.pow((l - minL) / (maxL - minL), 0.5);

          const idx = (py * Math.floor(plotW) + px) * 4;
          // Dark color scheme
          imgData.data[idx] = Math.floor(10 + t * 60);
          imgData.data[idx + 1] = Math.floor(10 + (1 - t) * 40 + t * 10);
          imgData.data[idx + 2] = Math.floor(30 + (1 - t) * 60);
          imgData.data[idx + 3] = 255;
        }
      }
      ctx.putImageData(imgData, pad.left, pad.top);

      // Contour lines
      const levels = 12;
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      for (let level = 0; level < levels; level++) {
        const targetL = minL + (level / levels) * (maxL - minL);
        // Simple contour: scan each row
        for (let py = 0; py < Math.floor(plotH); py += 3) {
          for (let px = 0; px < Math.floor(plotW) - 1; px += 3) {
            const xv1 = rangeX[0] + (px / plotW) * (rangeX[1] - rangeX[0]);
            const xv2 = rangeX[0] + ((px + 3) / plotW) * (rangeX[1] - rangeX[0]);
            const yv = rangeY[0] + (py / plotH) * (rangeY[1] - rangeY[0]);
            const l1 = lossFn(xv1, yv);
            const l2 = lossFn(xv2, yv);

            if ((l1 - targetL) * (l2 - targetL) < 0) {
              ctx.beginPath();
              ctx.arc(pad.left + px + 1.5, pad.top + py, 0.8, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = 'rgba(255,255,255,0.1)';
            }
          }
        }
      }

      // Draw batch GD path
      const bs = batchState.current;
      if (bs.history.length > 1) {
        ctx.beginPath();
        bs.history.forEach((p, i) => {
          const px = sx(p.x);
          const py = sy(p.y);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Current position
        const last = bs.history[bs.history.length - 1];
        ctx.beginPath();
        ctx.arc(sx(last.x), sy(last.y), 8, 0, Math.PI * 2);
        ctx.fillStyle = '#6366f1';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Start marker
      ctx.beginPath();
      ctx.arc(sx(3), sy(2.5), 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Start', sx(3) + 10, sy(2.5) + 4);

      // Draw SGD path
      const ss = sgdState.current;
      if (ss.history.length > 1) {
        ctx.beginPath();
        ss.history.forEach((p, i) => {
          const px = sx(p.x);
          const py = sy(p.y);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Current position
        const last = ss.history[ss.history.length - 1];
        ctx.beginPath();
        ctx.arc(sx(last.x), sy(last.y), 8, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Minimum marker
      ctx.beginPath();
      ctx.arc(sx(0), sy(0), 10, 0, Math.PI * 2);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#34d399';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Minimum', sx(0), sy(0) + 22);

      // Labels
      ctx.font = '13px Inter, sans-serif';
      // Batch label
      if (bs.history.length > 0) {
        const bl = bs.history[bs.history.length - 1];
        ctx.fillStyle = '#6366f1';
        ctx.textAlign = 'left';
        ctx.fillText('Batch GD', sx(bl.x) + 12, sy(bl.y) - 5);
      }
      if (ss.history.length > 0) {
        const sl = ss.history[ss.history.length - 1];
        ctx.fillStyle = '#f59e0b';
        ctx.textAlign = 'left';
        ctx.fillText('SGD', sx(sl.x) + 12, sy(sl.y) - 5);
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
  }, [isInView, isRunning]);

  return (
    <SectionWrapper id="sgd-explanation">
      <div ref={containerRef}>
        <span className="section__label">⚡ Section 6</span>
        <h2 className="section__title">Stochastic Gradient Descent</h2>
        <p className="section__subtitle">
          Instead of computing the gradient using <strong>all data</strong> (expensive!),
          SGD uses <strong>one random sample</strong> at a time. The path is noisier,
          but it reaches a good answer much faster.
        </p>

        <div className="split">
          <motion.div
            className="viz-container"
            style={{ height: 400 }}
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3 }}
          >
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
          </motion.div>

          <motion.div
            className="split-text"
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.5 }}
          >
            <div className="card">
              <h3 style={{ color: '#6366f1', fontSize: '1rem', marginBottom: '0.5rem' }}>
                🔵 Batch Gradient Descent
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Uses <strong>all data</strong> to compute each step.
                Smooth, predictable path but <span style={{ color: '#f87171' }}>slow on large datasets</span>.
              </p>
            </div>

            <div className="card">
              <h3 style={{ color: '#f59e0b', fontSize: '1rem', marginBottom: '0.5rem' }}>
                🟡 Stochastic Gradient Descent
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Uses <strong>one random sample</strong> per step.
                Noisy zig-zag path but <span style={{ color: '#34d399' }}>much faster per step</span>.
                The noise can even help escape local minima!
              </p>
            </div>

            <div className="controls-row">
              <button
                className={`btn ${isRunning ? 'btn-outline' : 'btn-primary'}`}
                onClick={() => setIsRunning(!isRunning)}
              >
                {isRunning ? '⏸ Pause' : '▶ Compare'}
              </button>
              <button className="btn btn-outline" onClick={resetStates}>
                🔄 Reset
              </button>
            </div>
          </motion.div>
        </div>

        <div className="legend" style={{ justifyContent: 'center', marginTop: '1rem' }}>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#6366f1' }}></div>
            <span>Batch GD – smooth path</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#f59e0b' }}></div>
            <span>SGD – noisy but fast</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#34d399' }}></div>
            <span>Minimum (goal)</span>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
