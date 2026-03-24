import React, { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function SectionWrapper({ children, id, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });

  return (
    <motion.section
      id={id}
      ref={ref}
      className={`section ${className}`}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <motion.div
        className="section__inner"
        initial={{ y: 40 }}
        animate={isInView ? { y: 0 } : { y: 40 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
      >
        {children}
      </motion.div>
    </motion.section>
  );
}
