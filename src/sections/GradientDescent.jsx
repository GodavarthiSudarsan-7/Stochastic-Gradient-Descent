import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import SectionWrapper from '../components/SectionWrapper';
import Slider from '../components/Slider';

export default function GradientDescent() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.3 });
  const animRef = useRef(null);
  const [learningRate, setLearningRate] = useState(0.1);
  const [isRunning, setIsRunning] = useState(false);
  const ballState = useRef({ x: 5.5, steps: 0, history: [], settled: false });

  const lossFn = (x) => Math.pow(x - 3, 2) + 0.8 * Math.sin(1.5 * x) + 4;
  const gradFn = (x) => 2 * (x - 3) + 0.8 * 1.5 * Math.cos(1.5 * x);

  const reset = () => {
    ballState.current = { x: 5.5, steps: 0, history: [5.5], settled: false };
    setIsRunning(false);
  };

  const step = () => {
    const bs = ballState.current;
    if (bs.settled) return;
    const grad = gradFn(bs.x);
    bs.x = bs.x - learningRate * grad;
    bs.steps++;
    bs.history.push(bs.x);
    if (bs.history.length > 200) bs.history.shift();
    if (Math.abs(grad) < 0.01 || bs.steps > 500) bs.settled = true;
  };

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

    let frameCount = 0;

    const draw = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      frameCount++;

      if (isRunning && frameCount % 8 === 0) {
        step();
      }

      ctx.clearRect(0, 0, w, h);

      const pad = { top: 40, right: 30, bottom: 55, left: 60 };
      const plotW = w - pad.left - pad.right;
      const plotH = h - pad.top - pad.bottom;

      const xMin = -1, xMax = 8, yMin = 0, yMax = 25;
      const sx = (v) => pad.left + ((v - xMin) / (xMax - xMin)) * plotW;
      const sy = (v) => pad.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const yv = yMin + (i / 5) * (yMax - yMin);
        ctx.beginPath(); ctx.moveTo(pad.left, sy(yv)); ctx.lineTo(w - pad.right, sy(yv)); ctx.stroke();
      }

      // Loss curve
      ctx.beginPath();
      for (let i = 0; i <= 300; i++) {
        const xv = xMin + (i / 300) * (xMax - xMin);
        const yv = lossFn(xv);
        if (i === 0) ctx.moveTo(sx(xv), sy(yv));
        else ctx.lineTo(sx(xv), sy(yv));
      }
      const curveGrad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
      curveGrad.addColorStop(0, 'rgba(248,113,113,0.7)');
      curveGrad.addColorStop(1, 'rgba(52,211,153,0.7)');
      ctx.strokeStyle = curveGrad;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Fill under
      ctx.lineTo(sx(xMax), sy(yMin));
      ctx.lineTo(sx(xMin), sy(yMin));
      ctx.closePath();
      const fillGrad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
      fillGrad.addColorStop(0, 'rgba(248,113,113,0.03)');
      fillGrad.addColorStop(1, 'rgba(52,211,153,0.05)');
      ctx.fillStyle = fillGrad;
      ctx.fill();

      // Path history
      const bs = ballState.current;
      if (bs.history.length > 1) {
        ctx.beginPath();
        bs.history.forEach((hx, i) => {
          const hy = lossFn(hx);
          if (i === 0) ctx.moveTo(sx(hx), sy(hy));
          else ctx.lineTo(sx(hx), sy(hy));
        });
        ctx.strokeStyle = 'rgba(251,191,36,0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Step markers
        bs.history.forEach((hx, i) => {
          if (i % 2 === 0) {
            const hy = lossFn(hx);
            ctx.beginPath();
            ctx.arc(sx(hx), sy(hy), 2.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(251,191,36,0.5)';
            ctx.fill();
          }
        });
      }

      // Ball
      const ballX = bs.x;
      const ballY = lossFn(ballX);

      // Gradient arrow
      const grad = gradFn(ballX);
      const arrowDir = -Math.sign(grad);
      const arrowLen = Math.min(Math.abs(grad) * 3, 50);

      ctx.save();
      ctx.translate(sx(ballX), sy(ballY));
      // Arrow line
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(arrowDir * arrowLen, 0);
      ctx.stroke();
      // Arrowhead
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(arrowDir * arrowLen, 0);
      ctx.lineTo(arrowDir * (arrowLen - 8), -5);
      ctx.lineTo(arrowDir * (arrowLen - 8), 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Ball glow
      const bGrad = ctx.createRadialGradient(sx(ballX), sy(ballY), 0, sx(ballX), sy(ballY), 22);
      bGrad.addColorStop(0, 'rgba(99,102,241,0.5)');
      bGrad.addColorStop(1, 'rgba(99,102,241,0)');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.arc(sx(ballX), sy(ballY), 22, 0, Math.PI * 2);
      ctx.fill();

      // Ball
      ctx.beginPath();
      ctx.arc(sx(ballX), sy(ballY), 9, 0, Math.PI * 2);
      ctx.fillStyle = '#6366f1';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Stats
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '11px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Step: ${bs.steps}`, pad.left + 8, pad.top + 18);
      ctx.fillText(`Loss: ${ballY.toFixed(3)}`, pad.left + 8, pad.top + 34);
      ctx.fillText(`Gradient: ${grad.toFixed(3)}`, pad.left + 8, pad.top + 50);

      // Axis labels
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Parameter (w)', w / 2, h - 10);
      ctx.save();
      ctx.translate(16, h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Loss', 0, 0);
      ctx.restore();

      // Learning rate visualization
      if (isRunning || bs.steps > 0) {
        const lrLabel = learningRate <= 0.05 ? '🐌 Very slow' :
                        learningRate <= 0.15 ? '🚶 Steady' :
                        learningRate <= 0.4 ? '🏃 Fast' : '🚀 Overshooting!';
        ctx.fillStyle = learningRate > 0.4 ? '#f87171' : 'rgba(255,255,255,0.5)';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(lrLabel, w - pad.right - 8, pad.top + 18);
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
  }, [isInView, isRunning, learningRate]);

  return (
    <SectionWrapper id="gradient-descent">
      <div ref={containerRef}>
        <span className="section__label">🎯 Section 4</span>
        <h2 className="section__title">Gradient Descent</h2>
        <p className="section__subtitle">
          The algorithm is simple: compute the slope (gradient), then take a small
          step in the opposite direction. Repeat until you reach the bottom.
          The <strong>learning rate</strong> controls how big each step is.
        </p>

        <motion.div
          className="viz-container"
          style={{ height: 400 }}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
        >
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
        </motion.div>

        <motion.div
          className="card controls-panel"
          style={{ marginTop: '1rem' }}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
        >
          <Slider
            label="Learning Rate"
            value={learningRate}
            min={0.01}
            max={0.8}
            step={0.01}
            onChange={setLearningRate}
          />
          <div className="controls-row">
            <button
              className={`btn ${isRunning ? 'btn-outline' : 'btn-primary'}`}
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? '⏸ Pause' : '▶ Start Descent'}
            </button>
            <button className="btn btn-outline" onClick={() => { step(); }}>
              ⏭ Single Step
            </button>
            <button className="btn btn-outline" onClick={reset}>
              🔄 Reset
            </button>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">Steps</span>
              <span className="stat-value">{ballState.current.steps}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Current Loss</span>
              <span className="stat-value">{lossFn(ballState.current.x).toFixed(4)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Learning Rate</span>
              <span className="stat-value">{learningRate}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
