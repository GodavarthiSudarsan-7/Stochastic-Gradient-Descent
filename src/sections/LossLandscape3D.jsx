import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { motion, useInView } from 'framer-motion';
import SectionWrapper from '../components/SectionWrapper';
import * as THREE from 'three';

// Loss surface function: two-parameter loss
function lossFunction(x, z) {
  return (
    Math.pow(x, 2) + Math.pow(z, 2)
    - 0.8 * Math.exp(-((x - 1) ** 2 + (z - 1) ** 2) / 0.5)
    + 0.5 * Math.sin(x * 2) * Math.cos(z * 2)
    + 3
  );
}

function gradLoss(x, z) {
  const eps = 0.01;
  const dx = (lossFunction(x + eps, z) - lossFunction(x - eps, z)) / (2 * eps);
  const dz = (lossFunction(x, z + eps) - lossFunction(x, z - eps)) / (2 * eps);
  return [dx, dz];
}

function Surface() {
  const meshRef = useRef();
  const size = 4;
  const res = 80;

  const { geometry, colors } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size * 2, size * 2, res, res);
    const pos = geo.attributes.position;
    const colorArr = new Float32Array(pos.count * 3);

    let minY = Infinity, maxY = -Infinity;

    // First pass: compute heights
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const y = lossFunction(x, z);
      pos.setZ(i, y * 0.4);
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }

    // Second pass: compute colors
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getZ(i) / 0.4;
      const t = (y - minY) / (maxY - minY);
      // Cool (blue/green) to warm (red/orange) gradient
      const r = t * 0.9 + 0.1;
      const g = (1 - Math.abs(t - 0.4)) * 0.8;
      const b = (1 - t) * 0.8 + 0.2;
      colorArr[i * 3] = r;
      colorArr[i * 3 + 1] = g;
      colorArr[i * 3 + 2] = b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));
    geo.computeVertexNormals();

    return { geometry: geo, colors: colorArr };
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <meshStandardMaterial
        vertexColors
        transparent
        opacity={0.85}
        side={THREE.DoubleSide}
        roughness={0.6}
        metalness={0.1}
      />
    </mesh>
  );
}

function WireframeSurface() {
  const size = 4;
  const res = 40;

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size * 2, size * 2, res, res);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const y = lossFunction(x, z);
      pos.setZ(i, y * 0.4);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
      <wireframeGeometry args={[geometry]} />
      <lineBasicMaterial color="#6366f1" transparent opacity={0.12} />
    </lineSegments>
  );
}

function DescentBall() {
  const meshRef = useRef();
  const trailRef = useRef();
  const pos = useRef({ x: 3.0, z: 3.0 });
  const trail = useRef([]);
  const lr = 0.02;

  useFrame(() => {
    const [dx, dz] = gradLoss(pos.current.x, pos.current.z);
    pos.current.x -= lr * dx;
    pos.current.z -= lr * dz;

    const y = lossFunction(pos.current.x, pos.current.z) * 0.4 + 0.15;

    if (meshRef.current) {
      meshRef.current.position.set(pos.current.x, y, pos.current.z);
    }

    trail.current.push(new THREE.Vector3(pos.current.x, y - 0.05, pos.current.z));
    if (trail.current.length > 300) trail.current.shift();

    if (trailRef.current && trail.current.length > 2) {
      const geo = new THREE.BufferGeometry().setFromPoints(trail.current);
      trailRef.current.geometry.dispose();
      trailRef.current.geometry = geo;
    }
  });

  return (
    <>
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#f59e0b"
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.3}
        />
      </mesh>
      <line ref={trailRef}>
        <bufferGeometry />
        <lineBasicMaterial color="#f59e0b" transparent opacity={0.5} />
      </line>
    </>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow />
      <pointLight position={[-3, 5, -3]} intensity={0.3} color="#6366f1" />

      <Surface />
      <WireframeSurface />
      <DescentBall />

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={12}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.2}
        autoRotate
        autoRotateSpeed={0.5}
      />

      {/* Grid helper */}
      <gridHelper args={[8, 20, '#1a1a3e', '#1a1a3e']} position={[0, -0.05, 0]} />
    </>
  );
}

export default function LossLandscape3D() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.2 });

  return (
    <SectionWrapper id="loss-landscape-3d">
      <div ref={containerRef}>
        <span className="section__label">🌄 Section 5</span>
        <h2 className="section__title">3D Loss Landscape</h2>
        <p className="section__subtitle">
          In real models, we have <strong>multiple parameters</strong>. The loss
          surface becomes a 3D (or higher-dimensional) landscape. The ball must
          navigate this terrain to find the deepest valley.
        </p>

        <motion.div
          className="viz-container"
          style={{ height: 480 }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {isInView && (
            <Canvas
              camera={{ position: [6, 5, 6], fov: 45 }}
              style={{ background: '#0a0a0f' }}
              shadows
            >
              <Scene />
            </Canvas>
          )}
        </motion.div>

        <motion.p
          style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
        >
          🖱️ Drag to rotate • Scroll to zoom • Watch the ball descend to the minimum
        </motion.p>

        <div className="legend" style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#f59e0b' }}></div>
            <span>Gradient descent ball</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#34d399' }}></div>
            <span>Low loss (valley)</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#f87171' }}></div>
            <span>High loss (peak)</span>
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
