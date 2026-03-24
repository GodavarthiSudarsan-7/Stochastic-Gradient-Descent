import React, { useState, useEffect, useCallback } from 'react';
import Navigation from './components/Navigation';
import Introduction from './sections/Introduction';
import LossFunction from './sections/LossFunction';
import MountainAnalogy from './sections/MountainAnalogy';
import GradientDescent from './sections/GradientDescent';
import LossLandscape3D from './sections/LossLandscape3D';
import SGDExplanation from './sections/SGDExplanation';
import InteractiveComparison from './sections/InteractiveComparison';
import Takeaway from './sections/Takeaway';

const sections = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'loss-function', label: 'Loss Function' },
  { id: 'mountain-analogy', label: 'Mountain Analogy' },
  { id: 'gradient-descent', label: 'Gradient Descent' },
  { id: 'loss-landscape-3d', label: '3D Landscape' },
  { id: 'sgd-explanation', label: 'SGD' },
  { id: 'interactive-comparison', label: 'Comparison' },
  { id: 'takeaway', label: 'Takeaway' },
];

export default function App() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);

    // Determine active section
    const sectionEls = sections.map(s => document.getElementById(s.id));
    const viewportCenter = scrollTop + window.innerHeight / 2;

    for (let i = sectionEls.length - 1; i >= 0; i--) {
      const el = sectionEls[i];
      if (el && el.offsetTop <= viewportCenter) {
        setActiveIndex(i);
        break;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleNavClick = useCallback((id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <>
      <div className="progress-bar" style={{ width: `${scrollProgress}%` }} />
      <Navigation
        sections={sections}
        activeIndex={activeIndex}
        onNavClick={handleNavClick}
      />
      <main>
        <Introduction />
        <LossFunction />
        <MountainAnalogy />
        <GradientDescent />
        <LossLandscape3D />
        <SGDExplanation />
        <InteractiveComparison />
        <Takeaway />
      </main>
    </>
  );
}
