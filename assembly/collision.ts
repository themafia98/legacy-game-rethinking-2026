// AABB overlap — top-left origin, @inline so it folds into 4 comparisons at the call site.
@inline
export function testAABB(
  ax: f32, ay: f32, aw: f32, ah: f32,
  bx: f32, by: f32, bw: f32, bh: f32,
): bool {
  return ax < bx + bw && ax + aw > bx &&
         ay < by + bh && ay + ah > by;
}
