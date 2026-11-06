import { MeshStandardMaterial } from 'three';

/** No global instances: resources belong to the character that creates them. */
export function createWarriorMaterials() {
  return {
    skin: new MeshStandardMaterial({ color: '#c99872', roughness: 0.85 }),
    jacket: new MeshStandardMaterial({ color: '#935138', roughness: 0.8 }),
    shirt: new MeshStandardMaterial({ color: '#d4c1a0', roughness: 1 }),
    cloth: new MeshStandardMaterial({ color: '#454956', roughness: 1 }),
    leather: new MeshStandardMaterial({ color: '#60422f', roughness: 0.9 }),
    hair: new MeshStandardMaterial({ color: '#705039', roughness: 1 }),
    face: new MeshStandardMaterial({ color: '#29201b', roughness: 1 }),
    steel: new MeshStandardMaterial({ color: '#a5afb0', roughness: 0.55, metalness: 0.45, flatShading: true }),
    gold: new MeshStandardMaterial({ color: '#b59552', roughness: 0.65, metalness: 0.3, flatShading: true }),
  };
}

export type WarriorMaterials = ReturnType<typeof createWarriorMaterials>;
