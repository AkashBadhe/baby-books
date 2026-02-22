export function wrapIndex(nextIndex, total) {
  return (nextIndex + total) % total;
}

export function detectSwipe({ startX, startY, endX, endY, minDistance = 45, horizontalBias = 1.2 }) {
  const dx = endX - startX;
  const dy = endY - startY;

  if (Math.abs(dx) <= minDistance) return null;
  if (Math.abs(dx) <= Math.abs(dy) * horizontalBias) return null;
  return dx < 0 ? "left" : "right";
}
