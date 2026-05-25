import type { Solution } from '../solver/solver';

const COLUMN_WIDTH = 320;
const ROW_HEIGHT = 140;
const TOP_PAD = 40;

/**
 * Simple deterministic layout: assign each node a "depth" (longest path from a raw
 * source), use that as the column. Within each column, stack nodes vertically.
 */
export function layoutNodes(solution: Solution): Map<string, { x: number; y: number }> {
  const depths = new Map<string, number>();

  // Raw nodes are depth 0.
  for (const raw of solution.rawNodes.values()) depths.set(raw.id, 0);

  // Iteratively compute depths for recipe nodes: 1 + max(depth of inputs).
  // The dependency edge direction is source -> target, where source is the producer
  // and target is the consumer. So a node's depth = 1 + max(depth(source) for source in inEdges).
  const incoming = new Map<string, string[]>();
  for (const e of solution.edges) {
    (incoming.get(e.target) ?? incoming.set(e.target, []).get(e.target)!).push(e.source);
  }

  // Topological-ish pass: iterate until stable.
  let changed = true;
  let safety = solution.recipeNodes.size + 5;
  while (changed && safety-- > 0) {
    changed = false;
    for (const node of solution.recipeNodes.values()) {
      const ins = incoming.get(node.id) ?? [];
      let max = 0;
      for (const s of ins) {
        const d = depths.get(s);
        if (d !== undefined && d + 1 > max) max = d + 1;
      }
      const cur = depths.get(node.id);
      if (cur === undefined || max > cur) {
        depths.set(node.id, max || 1);
        changed = true;
      }
    }
  }

  // Group nodes by depth.
  const byDepth = new Map<number, string[]>();
  for (const [id, d] of depths) {
    (byDepth.get(d) ?? byDepth.set(d, []).get(d)!).push(id);
  }

  const positions = new Map<string, { x: number; y: number }>();
  for (const [d, ids] of byDepth) {
    ids.sort();
    ids.forEach((id, idx) => {
      positions.set(id, { x: d * COLUMN_WIDTH, y: TOP_PAD + idx * ROW_HEIGHT });
    });
  }
  return positions;
}
