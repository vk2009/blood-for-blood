// Gus's motorbike — present day, outdoors only. Built from primitives like
// everything else; the rider sits on it via the character's 'sit' pose.
import * as THREE from 'three';

const M = (color, rough = 0.6, metal = 0.2) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

export const SEAT_LIFT = 0.3;   // how far the seated rider is raised onto the saddle

export function createBike() {
  const g = new THREE.Group();
  const black = M('#1b1b1d', 0.8), chrome = M('#c9ccd2', 0.25, 0.9), paint = M('#7a1d16', 0.35, 0.4), tyre = M('#121212', 0.95);
  const box = (w, h, d, m, x, y, z, rx = 0) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    b.position.set(x, y, z); b.rotation.x = rx; b.castShadow = true; g.add(b); return b;
  };
  const wheels = [];
  for (const z of [0.66, -0.62]) {
    const w = new THREE.Group(); w.position.set(0, 0.33, z);
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.075, 10, 22), tyre); t.rotation.y = Math.PI / 2; t.castShadow = true;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 10), chrome); hub.rotation.z = Math.PI / 2;
    for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.5, 0.025), chrome); s.rotation.x = (i * Math.PI) / 4; w.add(s); }
    w.add(t, hub); g.add(w); wheels.push(w);
  }
  box(0.08, 0.08, 1.1, black, 0, 0.45, 0, -0.08);            // frame
  box(0.26, 0.28, 0.5, black, 0, 0.5, 0.02);                 // engine
  box(0.06, 0.06, 0.6, chrome, 0.13, 0.32, -0.25, 0.15);     // exhaust
  box(0.3, 0.2, 0.45, paint, 0, 0.82, 0.28, 0.12);           // tank
  box(0.28, 0.09, 0.55, black, 0, 0.76, -0.2);               // seat
  box(0.04, 0.6, 0.04, chrome, 0.07, 0.68, 0.6, -0.35);      // forks
  box(0.04, 0.6, 0.04, chrome, -0.07, 0.68, 0.6, -0.35);
  box(0.66, 0.035, 0.035, chrome, 0, 1.02, 0.5);              // handlebar
  box(0.3, 0.06, 0.3, paint, 0, 0.62, 0.66);                  // front fender
  box(0.3, 0.06, 0.34, paint, 0, 0.6, -0.66);                 // rear fender
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12), M('#fff6d8', 0.2, 0.1));
  lamp.material.emissive = new THREE.Color('#ffe9a8'); lamp.material.emissiveIntensity = 0.6;
  lamp.rotation.x = Math.PI / 2; lamp.position.set(0, 0.92, 0.74); g.add(lamp);
  g.userData.wheels = wheels;
  g.visible = false;
  return g;
}
