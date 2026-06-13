// Pure tracing-progress logic. The scene samples each stroke's SVG path into
// {x, y} points (~6 units apart) and feeds finger positions here.

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

// Generous circle around the stroke's first point.
export function isNearStart(points, finger, startRadius) {
  return dist(points[0], finger) <= startRadius;
}

// Consume consecutive points within tolerance of the finger. Fast drags eat
// many points per move; off-path or backwards fingers simply don't advance.
// Walking point-by-point (not "nearest point") is what enforces direction.
export function advance(points, currentIndex, finger, tolerance) {
  let i = currentIndex;
  while (i + 1 < points.length && dist(points[i + 1], finger) <= tolerance) i += 1;
  return i;
}

// Kids lift a touch early — allow missing the last endSlack points.
export function isComplete(points, currentIndex, endSlack = 2) {
  return currentIndex >= points.length - 1 - endSlack;
}
