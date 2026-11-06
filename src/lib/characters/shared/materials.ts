import { MeshStandardMaterial } from 'three';

/** No global instances: resources belong to the character that creates them. */
export function createWarriorMaterials() {
  return {
    skin: new MeshStandardMaterial({ color: '#d6a278', roughness: 0.9, flatShading: true }),
    armor: new MeshStandardMaterial({ color: '#3f7693', roughness: 0.65, metalness: 0.25 }),
    cloth: new MeshStandardMaterial({ color: '#314152', roughness: 1 }),
    leather: new MeshStandardMaterial({ color: '#694c36', roughness: 0.95 }),
    steel: new MeshStandardMaterial({ color: '#b7c9cd', roughness: 0.5, metalness: 0.5 }),
    gold: new MeshStandardMaterial({ color: '#d4a54e', roughness: 0.65, metalness: 0.3 }),
  };
}

export type WarriorMaterials = ReturnType<typeof createWarriorMaterials>;
