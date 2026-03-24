import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import SectionWrapper from '../components/SectionWrapper';

export default function Introduction() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.3 });
  const [slope, setSlope] = useState(2.5);
  const [intercept, setIntercept] = useState(50);
  const animRef = useRef(null);
  const isDragging = useRef(false);
  const dragStartY = useRef(0);
  const dragStartSlope = useRef(0);

  // Data points (study hours → exam score)
  const data = [
    { x: 1, y: 45 }, { x: 2, y: 55 }, { x: 3, y: 58 },
    { x: 4, y: 70 }, { x: 5, y: 72 }, { x: 6, y: 80 },
    { x: 7, y: 82 }, { x: 8, y: 90 }, { x: 9, y: 92 },
  ];

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

    const draw = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      time += 0.02;

      ctx.clearRect(0, 0, w, h);

      // Padding
      const pad = { top: 40, right: 30, bottom: 50, left: 60 };
      const plotW = w - pad.left - pad.right;
      const plotH = h - pad.top - pad.bottom;

      // Scales
      const xMin = 0, xMax = 10, yMin = 30, yMax = 100;
      const sx = (v) => pad.left + ((v - xMin) / (xMax - xMin)) * plotW;
      const sy = (v) => pad.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const yv = yMin + (i / 5) * (yMax - yMin);
        ctx.beginPath();
        ctx.moveTo(pad.left, sy(yv));
        ctx.lineTo(w - pad.right, sy(yv));
        ctx.stroke();
      }
      for (let i = 0; i <= 5; i++) {
        const xv = xMin + (i / 5) * (xMax - xMin);
        ctx.beginPath();
        ctx.moveTo(sx(xv), pad.top);
        ctx.lineTo(sx(xv), h - pad.bottom);
        ctx.stroke();
      }

      // Axis labels
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Study Hours', w / 2, h - 8);
      ctx.save();
      ctx.translate(14, h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText('Exam Score', 0, 0);
      ctx.restore();

      // Tick labels
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.textAlign = 'center';
      for (let i = 0; i <= 10; i += 2) {
        ctx.fillText(i, sx(i), h - pad.bottom + 16);
      }
      ctx.textAlign = 'right';
      for (let i = 0; i <= 5; i++) {
        const yv = yMin + (i / 5) * (yMax - yMin);
        ctx.fillText(Math.round(yv), pad.left - 8, sy(yv) + 4);
      }

      // Prediction line
      const predict = (x) => slope * x + intercept;
      ctx.strokeStyle = 'rgba(99,102,241,0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(sx(xMin), sy(predict(xMin)));
      ctx.lineTo(sx(xMax), sy(predict(xMax)));
      ctx.stroke();

      // Prediction line label
      ctx.fillStyle = 'rgba(99, 102, 241, 0.9)';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Prediction line (drag to adjust)', sx(xMax) - 160, sy(predict(xMax)) - 10);

      // Error lines & data points
      data.forEach((pt, idx) => {
        const predY = predict(pt.x);
        const error = Math.abs(pt.y - predY);
        const pulseFactor = 0.5 + 0.5 * Math.sin(time + idx * 0.7);

        // Error line (dashed)
        ctx.strokeStyle = `rgba(248,113,113,${0.4 + pulseFactor * 0.3})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(sx(pt.x), sy(pt.y));
        ctx.lineTo(sx(pt.x), sy(predY));
        ctx.stroke();
        ctx.setLineDash([]);

        // Error label
        if (error > 3) {
          ctx.fillStyle = `rgba(248,113,113,${0.5 + pulseFactor * 0.3})`;
          ctx.font = '9px JetBrains Mono, monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`${error.toFixed(1)}`, sx(pt.x) + 6, (sy(pt.y) + sy(predY)) / 2 + 3);
        }

        // Actual data point
        ctx.beginPath();
        ctx.arc(sx(pt.x), sy(pt.y), 5, 0, Math.PI * 2);
        ctx.fillStyle = '#34d399';
        ctx.fill();
        ctx.strokeStyle = 'rgba(52,211,153,0.3)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Predicted point on line
        ctx.beginPath();
        ctx.arc(sx(pt.x), sy(predY), 3, 0, Math.PI * 2);
        ctx.fillStyle = '#6366f1';
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    };

    if (isInView) {
      draw();
    }
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [isInView, slope, intercept]);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartSlope.current = slope;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const dy = dragStartY.current - e.clientY;
    const newSlope = Math.max(-2, Math.min(10, dragStartSlope.current + dy * 0.03));
    setSlope(newSlope);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <SectionWrapper id="introduction">
      <div ref={containerRef}>
        <span className="section__label">📊 Section 1</span>
        <h1 className="section__title">How Do Machines Learn?</h1>
        <p className="section__subtitle">
          Imagine you're trying to predict exam scores based on study hours.
          A machine builds a model — a simple line — and tries to get as close
          to the real answers as possible.
        </p>

        <div className="split">
          <div className="split-text">
            <motion.div
              className="card"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3 }}
            >
              <h3 style={{ color: '#34d399', marginBottom: '0.5rem', fontSize: '1rem' }}>
                🟢 Actual Values
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                The real exam scores. These are the data we want our model to match.
              </p>
            </motion.div>

            <motion.div
              className="card"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.5 }}
            >
              <h3 style={{ color: '#6366f1', marginBottom: '0.5rem', fontSize: '1rem' }}>
                🔵 Predicted Values
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                What our model guesses. Points on the prediction line.
              </p>
            </motion.div>

            <motion.div
              className="card"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.7 }}
            >
              <h3 style={{ color: '#f87171', marginBottom: '0.5rem', fontSize: '1rem' }}>
                🔴 Error (Loss)
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                The gap between prediction and reality. The dashed red lines show this error.
                <strong style={{ color: 'var(--text-primary)' }}> Our goal: make this as small as possible!</strong>
              </p>
            </motion.div>
          </div>

          <motion.div
            className="viz-container"
            style={{ height: 400, cursor: isDragging.current ? 'grabbing' : 'grab' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.2, duration: 0.5 }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
          </motion.div>
        </div>

        <motion.p
          style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1 }}
        >
          💡 Drag the chart up/down to adjust the prediction line and watch the errors change
        </motion.p>
      </div>
    </SectionWrapper>
  );
}
