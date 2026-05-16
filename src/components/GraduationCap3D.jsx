import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

function Cap() {
  const group = useRef()
  useFrame(({ clock }) => {
    group.current.rotation.y = clock.getElapsedTime() * 0.3
  })

  return (
    <group ref={group} position={[0, 0, 0]}>
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[1.2, 0.6, 8]} />
        <meshStandardMaterial color="#1d4ed8" metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.8, 0.9, 0.15, 16]} />
        <meshStandardMaterial color="#0f2040" roughness={0.6} />
      </mesh>
      <mesh position={[0.45, 0.25, 0.1]} rotation={[0.2, 0, 0.3]}>
        <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
      <mesh position={[0.52, 0.15, 0.15]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
    </group>
  )
}

export default function GraduationCap3D() {
  return (
    <Canvas camera={{ position: [0, 0, 3.5], fov: 45 }} dpr={[1, 2]} gl={{ alpha: true }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[3, 3, 3]} intensity={1} color="#3b82f6" />
      <pointLight position={[-2, -2, 2]} intensity={0.5} color="#f59e0b" />
      <Cap />
    </Canvas>
  )
}
