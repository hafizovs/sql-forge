import { describe, expect, it } from 'vitest';
import {
  COLUMN_ROW_HEIGHT,
  TABLE_HEADER_HEIGHT,
  TABLE_PADDING_BOTTOM,
} from '../../core/constants/canvas.constants';
import { columnCenterY, tableHeight } from './table-metrics';

describe('table-metrics', () => {
  it('height grows with column count', () => {
    const h1 = tableHeight(1);
    const h3 = tableHeight(3);
    expect(h1).toBe(
      TABLE_HEADER_HEIGHT + COLUMN_ROW_HEIGHT + TABLE_PADDING_BOTTOM,
    );
    expect(h3).toBe(h1 + 2 * COLUMN_ROW_HEIGHT);
    expect(h3).toBeGreaterThan(h1);
  });

  it('anchor Y is monotonic by column index', () => {
    const ys = [0, 1, 2, 3].map((i) => columnCenterY(50, i));
    for (let i = 1; i < ys.length; i++) {
      expect(ys[i]).toBeGreaterThan(ys[i - 1]!);
    }
  });
});
