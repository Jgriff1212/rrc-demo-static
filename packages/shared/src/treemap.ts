/**
 * Squarified Treemap Algorithm
 * Based on: "Squarified Treemaps" by Bruls, Huizing, and van Wijk
 *
 * This implementation converts weighted items into rectangles that fill a container
 * while optimizing for aspect ratios close to 1 (squares).
 */

export interface TreemapItem {
  id: string;
  weight: number;
  data?: any;
}

export interface TreemapRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  data?: any;
}

interface Container {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate the worst aspect ratio in a row
 */
function worst(row: TreemapItem[], width: number): number {
  const sum = row.reduce((acc, item) => acc + item.weight, 0);
  const rowMax = Math.max(...row.map(item => item.weight));
  const rowMin = Math.min(...row.map(item => item.weight));

  return Math.max(
    (width * width * rowMax) / (sum * sum),
    (sum * sum) / (width * width * rowMin)
  );
}

/**
 * Normalize weights to sum to container area
 */
function normalize(items: TreemapItem[], area: number): TreemapItem[] {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  return items.map(item => ({
    ...item,
    weight: (item.weight / totalWeight) * area,
  }));
}

/**
 * Layout a row of items
 */
function layoutRow(
  row: TreemapItem[],
  width: number,
  container: Container
): { rects: TreemapRect[]; remaining: Container } {
  const sum = row.reduce((acc, item) => acc + item.weight, 0);
  const rowHeight = sum / width;

  const rects: TreemapRect[] = [];
  let offsetX = container.x;

  for (const item of row) {
    const rectWidth = item.weight / rowHeight;
    rects.push({
      id: item.id,
      x: offsetX,
      y: container.y,
      width: rectWidth,
      height: rowHeight,
      data: item.data,
    });
    offsetX += rectWidth;
  }

  // Return remaining container
  const remaining: Container = {
    x: container.x,
    y: container.y + rowHeight,
    width: container.width,
    height: container.height - rowHeight,
  };

  return { rects, remaining };
}

/**
 * Squarify algorithm - recursive treemap layout
 */
function squarify(
  items: TreemapItem[],
  row: TreemapItem[],
  container: Container,
  rects: TreemapRect[]
): TreemapRect[] {
  if (items.length === 0) {
    if (row.length > 0) {
      const width = Math.min(container.width, container.height);
      const { rects: rowRects } = layoutRow(row, width, container);
      rects.push(...rowRects);
    }
    return rects;
  }

  const item = items[0];
  const remaining = items.slice(1);
  const width = Math.min(container.width, container.height);

  if (row.length === 0) {
    return squarify(remaining, [item], container, rects);
  }

  const rowWithItem = [...row, item];
  const worstCurrent = worst(row, width);
  const worstWithItem = worst(rowWithItem, width);

  if (worstWithItem < worstCurrent || row.length === 0) {
    // Adding item improves aspect ratio, add it to row
    return squarify(remaining, rowWithItem, container, rects);
  } else {
    // Layout current row and start new row
    const { rects: rowRects, remaining: newContainer } = layoutRow(row, width, container);
    rects.push(...rowRects);
    return squarify(items, [], newContainer, rects);
  }
}

/**
 * Main treemap function
 * Converts weighted items into rectangles filling the container
 */
export function treemap(
  items: TreemapItem[],
  containerWidth: number,
  containerHeight: number
): TreemapRect[] {
  if (items.length === 0) {
    return [];
  }

  // Filter out zero or negative weights
  const validItems = items.filter(item => item.weight > 0);

  if (validItems.length === 0) {
    return [];
  }

  // Normalize weights to container area
  const area = containerWidth * containerHeight;
  const normalized = normalize(validItems, area);

  // Sort by weight descending for better results
  const sorted = [...normalized].sort((a, b) => b.weight - a.weight);

  // Initial container
  const container: Container = {
    x: 0,
    y: 0,
    width: containerWidth,
    height: containerHeight,
  };

  return squarify(sorted, [], container, []);
}

/**
 * Helper to convert task priorities to weights
 */
export function priorityToWeight(
  priority: 'high' | 'medium' | 'low',
  weights: { high: number; medium: number; low: number } = { high: 3, medium: 2, low: 1 }
): number {
  return weights[priority];
}
