import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useInView } from 'framer-motion';
import SectionWrapper from '../components/SectionWrapper';
import Slider from '../components/Slider';

export default function InteractiveComparison() {
  const canvasRef = useRef(null);
  const lossCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.2 });
  const animRef = useRef(null);
  const [mode, setMode] = useState('sgd');
  const [speed, setSpeed] = useState(0.05);
  const [isRunning, setIsRunning] = useState(false);

  const lossFn = (x, y) => x * x + 2 * y * y + Math.sin(x * 1.5) * Math.cos(y * 1.5) + 5;
  const gradFn = (x, y) => {
    const eps = 0.01;
    return [
      (lossFn(x + eps, y) - lossFn(x - eps, y)) / (2 * eps),
      (lossFn(x, y + eps) - lossFn(x, y - eps)) / (2 * eps)
    ];
  };

  const state = useRef({ x: 3, y: 2.5, history: [], lossHistory: [], steps: 0 });

  const reset = useCallback(() => {
    state.current = { x: 3, y: 2.5, history: [{ x: 3, y: 2.5 }], lossHistory: [lossFn(3, 2.5)], steps: 0 };
    setIsRunning(false);
  }, []);

  useEffect(() => { reset(); }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const lossCanvas = lossCanvasRef.current;
    if (!canvas || !lossCanvas) return;
    const ctx = canvas.getContext('2d');
    const lctx = lossCanvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      [canvas, lossCanvas].forEach(c => {
        const rect = c.getBoundingClientRect();
        c.width = rect.width * dpr;
        c.height = rect.height * dpr;
        c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
      });
    };
    resize();
    window.addEventListener('resize', resize);
    let frameCount = 0;

    const draw = () => {
      const w = canvas.width / dpr, h = canvas.height / dpr;
      const lw = lossCanvas.width / dpr, lh = lossCanvas.height / dpr;
      frameCount++;

      if (isRunning && frameCount % 5 === 0) {
        const s = state.current;
        const [dx, dy] = gradFn(s.x, s.y);
        let noise = mode === 'sgd' ? 2.0 : mode === 'mini-batch' ? 0.8 : 0;
        s.x -= speed * (dx + (Math.random() - 0.5) * noise);
        s.y -= speed * (dy + (Math.random() - 0.5) * noise);
        s.steps++;
        s.history.push({ x: s.x, y: s.y });
        s.lossHistory.push(lossFn(s.x, s.y));
        if (s.history.length > 800) { s.history.shift(); s.lossHistory.shift(); }
      }

      // --- Contour plot ---
      ctx.clearRect(0, 0, w, h);
      const pad = 10, plotW = w - pad * 2, plotH = h - pad * 2;
      const rX = [-4, 4], rY = [-3, 3];
      const sx = v => pad + ((v - rX[0]) / (rX[1] - rX[0])) * plotW;
      const sy = v => pad + ((v - rY[0]) / (rY[1] - rY[0])) * plotH;

      const imgData = ctx.createImageData(Math.floor(plotW), Math.floor(plotH));
      let minL = Infinity, maxL = -Infinity;
      for (let py = 0; py < Math.floor(plotH); py += 4)
        for (let px = 0; px < Math.floor(plotW); px += 4) {
          const l = lossFn(rX[0] + (px / plotW) * 8, rY[0] + (py / plotH) * 6);
          if (l < minL) minL = l; if (l > maxL) maxL = l;
        }
      for (let py = 0; py < Math.floor(plotH); py++)
        for (let px = 0; px < Math.floor(plotW); px++) {
          const l = lossFn(rX[0] + (px / plotW) * 8, rY[0] + (py / plotH) * 6);
          const t = Math.pow((l - minL) / (maxL - minL), 0.5);
          const idx = (py * Math.floor(plotW) + px) * 4;
          imgData.data[idx] = 10 + t * 50;
          imgData.data[idx + 1] = 10 + (1 - t) * 35;
          imgData.data[idx + 2] = 30 + (1 - t) * 55;
          imgData.data[idx + 3] = 255;
        }
      ctx.putImageData(imgData, pad, pad);

      const pc = mode === 'batch' ? '#6366f1' : mode === 'sgd' ? '#f59e0b' : '#10b981';
      const s = state.current;
      if (s.history.length > 1) {
        ctx.beginPath();
        s.history.forEach((p, i) => { i === 0 ? ctx.moveTo(sx(p.x), sy(p.y)) : ctx.lineTo(sx(p.x), sy(p.y)); });
        ctx.strokeStyle = pc; ctx.lineWidth = 2; ctx.globalAlpha = 0.7; ctx.stroke(); ctx.globalAlpha = 1;
        const last = s.history[s.history.length - 1];
        ctx.beginPath(); ctx.arc(sx(last.x), sy(last.y), 7, 0, Math.PI * 2);
        ctx.fillStyle = pc; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(sx(0), sy(0), 8, 0, Math.PI * 2);
      ctx.strokeStyle = '#34d399'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = pc; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'left';
      ctx.fillText(mode === 'batch' ? 'Batch GD' : mode === 'sgd' ? 'SGD' : 'Mini-Batch GD', pad + 10, pad + 20);
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '10px JetBrains Mono';
      ctx.fillText(`Steps: ${s.steps}`, pad + 10, pad + 36);

      // --- Loss chart ---
      lctx.clearRect(0, 0, lw, lh);
      lctx.fillStyle = 'rgba(10,10,15,0.5)'; lctx.fillRect(0, 0, lw, lh);
      lctx.fillStyle = 'rgba(255,255,255,0.5)'; lctx.font = '11px Inter'; lctx.textAlign = 'center';
      lctx.fillText('Loss Over Steps', lw / 2, 16);
      const lP = { t: 25, r: 15, b: 30, l: 50 }, lpW = lw - lP.l - lP.r, lpH = lh - lP.t - lP.b;
      if (s.lossHistory.length > 1) {
        const mxL = Math.max(...s.lossHistory), mnL = Math.min(...s.lossHistory), rng = mxL - mnL || 1;
        lctx.beginPath();
        s.lossHistory.forEach((l, i) => {
          const px = lP.l + (i / (s.lossHistory.length - 1)) * lpW;
          const py = lP.t + lpH - ((l - mnL) / rng) * lpH;
          i === 0 ? lctx.moveTo(px, py) : lctx.lineTo(px, py);
        });
        lctx.strokeStyle = pc; lctx.lineWidth = 2; lctx.stroke();
        lctx.lineTo(lP.l + lpW, lP.t + lpH); lctx.lineTo(lP.l, lP.t + lpH); lctx.closePath();
        lctx.fillStyle = pc + '15'; lctx.fill();
        lctx.fillStyle = 'rgba(255,255,255,0.3)'; lctx.font = '9px JetBrains Mono'; lctx.textAlign = 'right';
        lctx.fillText(mxL.toFixed(1), lP.l - 5, lP.t + 10);
        lctx.fillText(mnL.toFixed(1), lP.l - 5, lP.t + lpH + 3);
      }
      lctx.fillStyle = 'rgba(255,255,255,0.3)'; lctx.font = '10px Inter'; lctx.textAlign = 'center';
      lctx.fillText('Steps', lw / 2, lh - 5);

      animRef.current = requestAnimationFrame(draw);
    };
    if (isInView) draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, [isInView, isRunning, mode, speed]);

  return (
    <SectionWrapper id="interactive-comparison">
      <div ref={containerRef}>
        <span className="section__label">🎮 Section 7</span>
        <h2 className="section__title">Interactive Comparison</h2>
        <p className="section__subtitle">
          Switch between methods and observe how each navigates the loss landscape.
        </p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}>
          <div className="card controls-panel" style={{ marginBottom: '1rem' }}>
            <div className="controls-row" style={{ justifyContent: 'center' }}>
              <div className="btn-group">
                {[{ key: 'batch', label: 'Batch GD' }, { key: 'sgd', label: 'SGD' }, { key: 'mini-batch', label: 'Mini-Batch' }].map(m => (
                  <button key={m.key} className={`btn ${mode === m.key ? 'active' : ''}`} onClick={() => setMode(m.key)}>{m.label}</button>
                ))}
              </div>
            </div>
            <div style={{ maxWidth: 300 }}>
              <Slider label="Learning Rate" value={speed} min={0.01} max={0.2} step={0.005} onChange={setSpeed} />
            </div>
            <div className="controls-row">
              <button className={`btn ${isRunning ? 'btn-outline' : 'btn-primary'}`} onClick={() => setIsRunning(!isRunning)}>
                {isRunning ? '⏸ Pause' : '▶ Run'}
              </button>
              <button className="btn btn-outline" onClick={reset}>🔄 Reset</button>
            </div>
          </div>
        </motion.div>

        <div className="split" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
          <motion.div className="viz-container" style={{ height: 380 }} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.4 }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
          </motion.div>
          <motion.div className="viz-container" style={{ height: 380 }} initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} transition={{ delay: 0.5 }}>
            <canvas ref={lossCanvasRef} style={{ width: '100%', height: '100%' }} />
          </motion.div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { color: '#6366f1', title: 'Batch GD', desc: 'Smooth path. Uses all data. Slow on large datasets.' },
            { color: '#f59e0b', title: 'SGD', desc: 'Noisy path. One sample per step. Fast but erratic.' },
            { color: '#10b981', title: 'Mini-Batch', desc: 'Best of both. Small batches. Most popular in practice.' },
          ].map(item => (
            <div key={item.title} className="card" style={{ flex: 1, minWidth: 200, borderLeft: `3px solid ${item.color}` }}>
              <h4 style={{ color: item.color, fontSize: '0.9rem', marginBottom: '0.5rem' }}>{item.title}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
