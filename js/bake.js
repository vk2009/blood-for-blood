// Merge a group's direct child meshes into one vertex-coloured mesh, so a
// rigid piece (a forearm, a head, a whole car) costs one draw call.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const BAKED_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72 });

export function bakeChildren(group, material = BAKED_MAT, castShadow = true) {
  const geos = [];
  const victims = [];
  for (const c of group.children) {
    if (!c.isMesh || Array.isArray(c.material)) continue;
    c.updateMatrix();
    let g = c.geometry.clone().applyMatrix4(c.matrix);
    if (g.index) g = g.toNonIndexed();
    for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name);
    g.clearGroups();
    // Material colours are stored in linear space, same as vertex colours.
    const col = c.material.color;
    const n = g.attributes.position.count;
    const colors = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b; }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geos.push(g);
    victims.push(c);
  }
  if (!geos.length) return null;
  for (const v of victims) group.remove(v);
  const m = new THREE.Mesh(mergeGeometries(geos, false), material);
  m.castShadow = castShadow;
  m.receiveShadow = true;
  group.add(m);
  return m;
}

// Bake every group in a hierarchy (children first so nothing is lost).
export function bakeHierarchy(root, material = BAKED_MAT) {
  const groups = [];
  root.traverse((o) => { if (!o.isMesh) groups.push(o); });
  for (const g of groups) bakeChildren(g, material);
}
