import { treemap, priorityToWeight, TreemapItem } from './treemap';

describe('treemap', () => {
  it('should generate rectangles for valid items', () => {
    const items: TreemapItem[] = [
      { id: '1', weight: 3 },
      { id: '2', weight: 2 },
      { id: '3', weight: 1 },
    ];

    const rects = treemap(items, 600, 800);

    expect(rects).toHaveLength(3);
    expect(rects.every(r => r.width > 0 && r.height > 0)).toBe(true);
  });

  it('should fill the entire container area', () => {
    const items: TreemapItem[] = [
      { id: '1', weight: 1 },
      { id: '2', weight: 1 },
      { id: '3', weight: 1 },
      { id: '4', weight: 1 },
    ];

    const rects = treemap(items, 400, 400);

    const totalArea = rects.reduce((sum, r) => sum + r.width * r.height, 0);
    const containerArea = 400 * 400;

    // Allow small floating point error
    expect(Math.abs(totalArea - containerArea)).toBeLessThan(1);
  });

  it('should handle single item', () => {
    const items: TreemapItem[] = [{ id: '1', weight: 1 }];

    const rects = treemap(items, 300, 400);

    expect(rects).toHaveLength(1);
    expect(rects[0].width).toBeCloseTo(300);
    expect(rects[0].height).toBeCloseTo(400);
  });

  it('should filter out zero weight items', () => {
    const items: TreemapItem[] = [
      { id: '1', weight: 3 },
      { id: '2', weight: 0 },
      { id: '3', weight: 2 },
    ];

    const rects = treemap(items, 500, 500);

    expect(rects).toHaveLength(2);
    expect(rects.find(r => r.id === '2')).toBeUndefined();
  });

  it('should return empty array for empty input', () => {
    const rects = treemap([], 500, 500);
    expect(rects).toEqual([]);
  });

  it('should handle items with different weights proportionally', () => {
    const items: TreemapItem[] = [
      { id: 'high', weight: 9 }, // 75% of total
      { id: 'low', weight: 3 },  // 25% of total
    ];

    const rects = treemap(items, 400, 400);
    const containerArea = 400 * 400;

    const highRect = rects.find(r => r.id === 'high')!;
    const lowRect = rects.find(r => r.id === 'low')!;

    const highArea = highRect.width * highRect.height;
    const lowArea = lowRect.width * lowRect.height;

    expect(highArea / containerArea).toBeCloseTo(0.75, 1);
    expect(lowArea / containerArea).toBeCloseTo(0.25, 1);
  });

  it('should preserve item data', () => {
    const items: TreemapItem[] = [
      { id: '1', weight: 1, data: { title: 'Task 1' } },
      { id: '2', weight: 2, data: { title: 'Task 2' } },
    ];

    const rects = treemap(items, 500, 500);

    expect(rects[0].data).toBeDefined();
    expect(rects[1].data).toBeDefined();
  });
});

describe('priorityToWeight', () => {
  it('should convert priority to default weights', () => {
    expect(priorityToWeight('high')).toBe(3);
    expect(priorityToWeight('medium')).toBe(2);
    expect(priorityToWeight('low')).toBe(1);
  });

  it('should use custom weights when provided', () => {
    const customWeights = { high: 5, medium: 3, low: 1 };
    expect(priorityToWeight('high', customWeights)).toBe(5);
    expect(priorityToWeight('medium', customWeights)).toBe(3);
    expect(priorityToWeight('low', customWeights)).toBe(1);
  });
});
