import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import SectionWrapper from '../components/SectionWrapper';

const takeaways = [
  {
    icon: '📐',
    title: 'Gradient Descent',
    desc: 'Move downhill by following the slope. Compute the gradient, take a step, repeat.',
    color: '#6366f1',
  },
  {
    icon: '⚡',
    title: 'Stochastic GD',
    desc: 'Use one random sample per step instead of the full dataset. Noisy but fast.',
    color: '#f59e0b',
  },
  {
    icon: '📦',
    title: 'Mini-Batch GD',
    desc: 'The sweet spot — use small batches for a balance of speed and stability.',
    color: '#10b981',
  },
];

const benefits = [
  { icon: '🚀', title: 'Faster on Large Data', desc: "Don't need to see all data before updating." },
  { icon: '💾', title: 'Uses Less Memory', desc: 'Only one sample (or small batch) in memory at a time.' },
  { icon: '🧠', title: 'Powers Deep Learning', desc: 'SGD and its variants train every neural network today.' },
  { icon: '🏔️', title: 'Escapes Local Minima', desc: 'Noise in SGD can help jump out of bad valleys.' },
];

export default function Takeaway() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.2 });

  return (
    <SectionWrapper id="takeaway">
      <div ref={containerRef}>
        <span className="section__label">🎓 Section 8</span>
        <h2 className="section__title">Key Takeaways</h2>
        <p className="section__subtitle">
          You've just learned one of the most important algorithms in machine
          learning. Here's a quick summary of everything.
        </p>

        <div className="takeaway-grid" style={{ marginBottom: '2.5rem' }}>
          {takeaways.map((item, i) => (
            <motion.div
              key={item.title}
              className="card takeaway-card"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.15 }}
              style={{ borderTop: `3px solid ${item.color}` }}
            >
              <div className="icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.h3
          style={{
            textAlign: 'center',
            fontSize: '1.5rem',
            marginBottom: '1.5rem',
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
        >
          Why SGD Matters
        </motion.h3>

        <div className="takeaway-grid">
          {benefits.map((item, i) => (
            <motion.div
              key={item.title}
              className="card takeaway-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.7 + i * 0.12 }}
            >
              <div className="icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          style={{
            marginTop: '3rem',
            textAlign: 'center',
            padding: '2rem',
            background: 'var(--gradient-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 1 }}
        >
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            🎉 Congratulations! You now understand the core idea behind how
            <strong style={{ color: 'var(--text-primary)' }}> machines learn from data</strong>.
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Every time a neural network gets smarter — from ChatGPT to self-driving cars —
            SGD (or a variant of it) is running behind the scenes.
          </p>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
