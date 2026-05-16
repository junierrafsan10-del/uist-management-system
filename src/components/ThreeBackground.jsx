import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import { IcosahedronGeometry, TorusGeometry, OctahedronGeometry, BoxGeometry, BufferGeometry, PointsMaterial, Points, BufferAttribute } from 'three'

function FloatingShape({ geo, position, color, speed = 1, phase = 0 }) {
  const mesh = useRef()
  useFrame(({ clock, mouse }) => {
    const t = clock.getElapsedTime()
    mesh.current.rotation.x += 0.003 * speed
    mesh.current.rotation.y += 0.005 * speed
    mesh.current.position.x = position[0] + Math.sin(t * 0.3 + phase) * 0.3 + mouse.x * 0.08
    mesh.current.position.y = position[1] + Math.sin(t * 0.2 + phase + 1) * 0.4 + mouse.y * 0.08
    mesh.current.position.z = position[2] + Math.sin(t * 0.15 + phase + 2) * 0.2
    const dist = Math.abs(mesh.current.position.z)
    mesh.current.material.opacity = Math.max(0.15, 0.5 - dist * 0.01)
  })
  return (
    <Float speed={0.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh ref={mesh} geometry={geo} position={position}>
        <meshBasicMaterial color={color} wireframe transparent opacity={0.4} />
      </mesh>
    </Float>
  )
}

function Particles({ count = 200 }) {
  const mesh = useRef()
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15
    }
    return pos
  }, [count])

  useFrame(() => {
    const pos = mesh.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += Math.sin(performance.now() * 0.0001 + i) * 0.002
      if (pos[i * 3 + 1] > 7.5) pos[i * 3 + 1] = -7.5
    }
    mesh.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#3b82f6" transparent opacity={0.4} sizeAttenuation />
    </points>
  )
}

function Scene() {
  const { mouse } = useThree()
  const light = useRef()
  useFrame(() => {
    if (light.current) {
      light.current.position.x = mouse.x * 5
      light.current.position.y = mouse.y * 5
    }
  })
  const shapes = useMemo(() => [
    { geo: new IcosahedronGeometry(0.6, 1), pos: [-3, 1, -2], color: '#3b82f6', speed: 1.2, phase: 0 },
    { geo: new TorusGeometry(0.5, 0.2, 16, 32), pos: [2.5, -1, -1], color: '#1d4ed8', speed: 0.8, phase: 1.5 },
    { geo: new OctahedronGeometry(0.5), pos: [-1.5, -2, -3], color: '#f59e0b', speed: 1, phase: 3 },
    { geo: new BoxGeometry(0.6, 0.6, 0.6), pos: [3.5, 1.5, -2], color: '#10b981', speed: 0.6, phase: 2 },
    { geo: new IcosahedronGeometry(0.4, 1), pos: [0, 2.5, -1], color: '#8b5cf6', speed: 1.4, phase: 0.7 },
  ], [])

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight ref={light} position={[0, 0, 5]} intensity={1.5} color="#3b82f6" />
      <Particles />
      {shapes.map((s, i) => <FloatingShape key={i} {...s} />)}
    </>
  )
}

export default function ThreeBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
        <Scene />
      </Canvas>
    </div>
  )
}
