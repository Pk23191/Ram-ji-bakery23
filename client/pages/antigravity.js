import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Float, Sphere, MeshDistortMaterial, Text, PerspectiveCamera, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import Layout from '../components/Layout';
import Seo from '../components/Seo';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, Zap, Target, Database, Maximize2, RotateCcw } from 'lucide-react';

// --- Simulation Logic ---

function AntigravityObject({ position, velocity, mass, settings }) {
  const meshRef = useRef();
  const [currentVelocity, setCurrentVelocity] = useState(new THREE.Vector3(...velocity));
  const [currentPosition, setCurrentPosition] = useState(new THREE.Vector3(...position));

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const gravityCenter = new THREE.Vector3(0, 0, 0);
    const pos = currentPosition.clone();
    const vel = currentVelocity.clone();

    // 1. Inverse Gravitational Force (Repulsion)
    // F = G * m1 * m2 / r^2
    const direction = pos.clone().sub(gravityCenter);
    const distanceSq = Math.max(direction.lengthSq(), 1); // Avoid division by zero
    const distance = Math.sqrt(distanceSq);

    // Apply repulsive force (Antigravity)
    const forceMagnitude = (settings.intensity * 100) / distanceSq;
    const force = direction.normalize().multiplyScalar(forceMagnitude);

    // 2. Air Resistance (Damping)
    const drag = vel.clone().multiplyScalar(-settings.airResistance);
    force.add(drag);

    // 3. Acceleration = F / m
    const acceleration = force.divideScalar(mass);

    // 4. Update Velocity and Position
    vel.add(acceleration.multiplyScalar(delta));
    
    // Bounds check - bounce back if too far
    if (pos.length() > settings.boundary) {
      vel.multiplyScalar(-0.8); // Bounce with some energy loss
      pos.normalize().multiplyScalar(settings.boundary - 0.1);
    }

    pos.add(vel.clone().multiplyScalar(delta));

    setCurrentVelocity(vel);
    setCurrentPosition(pos);

    meshRef.current.position.copy(pos);
    meshRef.current.rotation.x += delta * (vel.x + 0.5);
    meshRef.current.rotation.y += delta * (vel.y + 0.5);
  });

  return (
    <group>
      {/* Real Object */}
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <Sphere ref={meshRef} args={[0.5, 32, 32]}>
          <MeshDistortMaterial
            color={settings.color}
            speed={2}
            distort={0.4}
            radius={0.5}
            emissive={settings.color}
            emissiveIntensity={0.5}
            roughness={0}
            metalness={1}
          />
        </Sphere>
      </Float>

      {/* AI Prediction Path (Simple Line) */}
      {settings.showAI && (
        <LinePrediction position={currentPosition} velocity={currentVelocity} settings={settings} />
      )}
    </group>
  );
}

function LinePrediction({ position, velocity, settings }) {
  const points = useMemo(() => {
    const pts = [];
    let tempPos = position.clone();
    let tempVel = velocity.clone();
    const dt = 0.1;

    for (let i = 0; i < 20; i++) {
      pts.push(tempPos.clone());
      
      const gravityCenter = new THREE.Vector3(0, 0, 0);
      const direction = tempPos.clone().sub(gravityCenter);
      const distanceSq = Math.max(direction.lengthSq(), 1);
      const forceMagnitude = (settings.intensity * 100) / distanceSq;
      const force = direction.normalize().multiplyScalar(forceMagnitude);
      const drag = tempVel.clone().multiplyScalar(-settings.airResistance);
      force.add(drag);
      
      const acceleration = force.divideScalar(1); // Predicting for mass 1
      tempVel.add(acceleration.multiplyScalar(dt));
      tempPos.add(tempVel.clone().multiplyScalar(dt));
    }
    return pts;
  }, [position, velocity, settings.intensity, settings.airResistance]);

  return (
    <line>
      <bufferGeometry attach="geometry" setFromPoints={points} />
      <lineBasicMaterial attach="material" color={settings.color} opacity={0.3} transparent />
    </line>
  );
}

function Core({ intensity }) {
  return (
    <mesh>
      <Sphere args={[0.8, 64, 64]}>
        <MeshDistortMaterial
          color="#ff3366"
          speed={5}
          distort={0.6}
          radius={1}
          emissive="#ff0000"
          emissiveIntensity={intensity}
        />
      </Sphere>
      <pointLight intensity={intensity * 50} color="#ff3366" />
    </mesh>
  );
}

// --- Main Page Component ---

export default function AntigravityPage() {
  const [settings, setSettings] = useState({
    intensity: 5,
    airResistance: 0.5,
    boundary: 15,
    showAI: true,
    color: '#00ccff',
    objectCount: 5
  });

  const [energy, setEnergy] = useState(100);
  const [status, setStatus] = useState('Stable');

  // Energy consumption model
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy(prev => {
        const consumption = (settings.intensity * 0.1) + (settings.objectCount * 0.05);
        const next = Math.max(0, prev - consumption);
        if (next < 20) setStatus('Critical');
        else if (next < 50) setStatus('Warning');
        else setStatus('Stable');
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [settings]);

  const resetEnergy = () => setEnergy(100);

  const objects = useMemo(() => {
    return Array.from({ length: settings.objectCount }).map((_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      ],
      velocity: [
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ],
      mass: 0.5 + Math.random()
    }));
  }, [settings.objectCount]);

  return (
    <Layout>
      <Seo 
        title="Antigravity Simulator" 
        description="Experience futuristic cake-delivery physics in 3D."
        path="/antigravity"
      />
      
      <div className="relative h-[80vh] w-full bg-[#050510] overflow-hidden rounded-[40px] shadow-2xl">
        {/* Three.js Canvas */}
        <Canvas shadows gl={{ antialias: true }}>
          <PerspectiveCamera makeDefault position={[0, 0, 25]} />
          <OrbitControls enableDamping dampingFactor={0.05} />
          
          <ambientLight intensity={0.2} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <Environment preset="city" />

          {/* Core Repulsor */}
          <Core intensity={settings.intensity / 10} />

          {/* Floating Objects */}
          {energy > 0 && objects.map(obj => (
            <AntigravityObject 
              key={obj.id}
              position={obj.position}
              velocity={obj.velocity}
              mass={obj.mass}
              settings={settings}
            />
          ))}

          {/* Atmosphere */}
          <gridHelper args={[100, 50, 0x222222, 0x111111]} position={[0, -20, 0]} />
        </Canvas>

        {/* UI Overlay - Dashboard */}
        <div className="absolute top-8 left-8 z-10 w-80 space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-6 border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings2 size={20} className="text-[#00ccff]" />
                Engine Specs
              </h2>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                status === 'Stable' ? 'bg-green-500/20 text-green-400' : 
                status === 'Warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {status}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-mocha/60 uppercase tracking-widest">
                  <span>Inverse Force</span>
                  <span>{settings.intensity}.0 G</span>
                </div>
                <input 
                  type="range" min="0" max="20" step="0.5"
                  value={settings.intensity}
                  onChange={(e) => setSettings({...settings, intensity: parseFloat(e.target.value)})}
                  className="w-full accent-[#00ccff]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs text-mocha/60 uppercase tracking-widest">
                  <span>Damping</span>
                  <span>{Math.round(settings.airResistance * 100)}%</span>
                </div>
                <input 
                  type="range" min="0" max="2" step="0.1"
                  value={settings.airResistance}
                  onChange={(e) => setSettings({...settings, airResistance: parseFloat(e.target.value)})}
                  className="w-full accent-[#00ccff]"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-white semibold uppercase tracking-widest">AI Prediction</span>
                <button 
                  onClick={() => setSettings({...settings, showAI: !settings.showAI})}
                  className={`w-12 h-6 rounded-full transition-colors relative ${settings.showAI ? 'bg-[#00ccff]' : 'bg-white/10'}`}
                >
                  <motion.div 
                    animate={{ x: settings.showAI ? 24 : 4 }}
                    className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Energy Monitor */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-6 border-white/10"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Zap size={14} className="text-amber-400" />
                Power Core
              </span>
              <span className="text-lg font-mono text-white">{Math.round(energy)}%</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: '100%' }}
                animate={{ width: `${energy}%` }}
                className={`h-full transition-colors duration-500 ${
                  energy > 50 ? 'bg-[#00ccff]' : energy > 20 ? 'bg-amber-400' : 'bg-red-500'
                }`}
              />
            </div>
            {energy === 0 && (
              <button 
                onClick={resetEnergy}
                className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition"
              >
                <RotateCcw size={14} /> Re-Ignite Core
              </button>
            )}
          </motion.div>
        </div>

        {/* Info Box */}
        <div className="absolute bottom-8 right-8 text-right">
          <h3 className="text-white text-2xl font-black italic uppercase tracking-tighter">Antigravity Simulation</h3>
          <p className="text-mocha/50 text-xs">Propulsion logic powered by Ramji Bakery R&D</p>
        </div>
      </div>

      <div className="mt-12 max-w-4xl mx-auto space-y-8 px-4 mb-20">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Target className="text-[#00ccff]" />}
            title="Inverse Force Model"
            desc="Objects repel from the center based on squared distance, simulating pure antigravity fields."
          />
          <FeatureCard 
            icon={<Database className="text-purple-400" />}
            title="Real-time Telemetry"
            desc="Every bounce and drift is calculated frame-by-frame with high-precision physics vectors."
          />
          <FeatureCard 
            icon={<Zap className="text-amber-400" />}
            title="Energy Consumption"
            desc="Simulates power drain from maintaining high-intensity fields across multiple objects."
          />
        </div>
        
        <div className="glass-panel p-8">
          <h2 className="text-2xl font-bold text-cocoa">Step-by-Step Simulation Guide</h2>
          <div className="mt-6 space-y-4 text-mocha/75 leading-relaxed">
            <p>1. <strong>Repulsion Logic:</strong> Unlike standard gravity which pulls, our engine calculates a vector pointing AWAY from the core. The magnitude follows the inverse-square law, creating a realistic 'push' that weakens as objects drift further.</p>
            <p>2. <strong>Adaptive Damping:</strong> The 'Damping' control simulates atmospheric density. Higher values slow down objects faster, preventing chaotic oscillations.</p>
            <p>3. <strong>Bounds Enforcement:</strong> We've implemented a spherical boundary. When an object hits the limit, its velocity vector is inverted with an 80% energy retention, creating a soft bounce effect.</p>
            <p>4. <strong>Trajectory Forecasting:</strong> The AI Prediction (cyan lines) uses linear extrapolation. It calculates 20 steps ahead based on the current velocity and forces, allowing you to see where an object will float before it gets there.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-6 rounded-3xl bg-latte/20 border border-white/50">
      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-4">
        {icon}
      </div>
      <h4 className="font-bold text-cocoa">{title}</h4>
      <p className="mt-2 text-sm text-mocha/65 leading-6">{desc}</p>
    </div>
  );
}
