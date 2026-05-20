import { Vector2 } from '../math/Vector2';

function aabbOverlap(
  posA: Vector2, sizeA: [number, number],
  posB: Vector2, sizeB: [number, number],
): boolean {
  const r1 = posA.x + sizeA[0];
  const b1 = posA.y + sizeA[1];
  const r2 = posB.x + sizeB[0];
  const b2 = posB.y + sizeB[1];

  return !(r1 <= posB.x || posA.x > r2 || b1 <= posB.y || posA.y > b2);
}

export interface CollisionBox {
  position: Vector2;
  size: [number, number];
}

export function testAABB(a: CollisionBox, b: CollisionBox): boolean {
  return aabbOverlap(a.position, a.size, b.position, b.size);
}
