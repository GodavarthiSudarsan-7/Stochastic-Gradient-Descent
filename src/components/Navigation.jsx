import React from 'react';

export default function Navigation({ sections, activeIndex, onNavClick }) {
  return (
    <nav className="nav-dots" aria-label="Section navigation">
      {sections.map((s, i) => (
        <button
          key={s.id}
          className={`nav-dot ${i === activeIndex ? 'active' : ''}`}
          data-label={s.label}
          onClick={() => onNavClick(s.id)}
          aria-label={`Go to ${s.label}`}
        />
      ))}
    </nav>
  );
}
