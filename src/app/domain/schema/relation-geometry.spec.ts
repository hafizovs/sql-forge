import { describe, expect, it } from 'vitest';
import {
  COLUMN_ROW_HEIGHT,
  TABLE_HEADER_HEIGHT,
  TABLE_WIDTH,
} from '../../core/constants/canvas.constants';
import type { Table } from '../../models/schema.types';
import {
  buildRelationPath,
  cardinalityLabels,
  chooseSides,
} from './relation-geometry';
import { columnCenterY } from './table-metrics';

function makeTable(
  id: string,
  x: number,
  y: number,
  columnCount = 2,
): Table {
  return {
    id,
    name: id,
    x,
    y,
    columns: Array.from({ length: columnCount }, (_, i) => ({
      id: `${id}_c${i}`,
      name: `c${i}`,
      dataType: 'INT' as const,
      primaryKey: i === 0,
      foreignKey: false,
      notNull: true,
      unique: false,
    })),
  };
}

describe('relation-geometry', () => {
  it('selects right/left when target is to the right', () => {
    const from = makeTable('a', 0, 0);
    const to = makeTable('b', TABLE_WIDTH + 40, 0);
    const sides = chooseSides(from, to, false);
    expect(sides.startSide).toBe('right');
    expect(sides.endSide).toBe('left');
  });

  it('selects left/right when target is to the left', () => {
    const from = makeTable('a', 400, 0);
    const to = makeTable('b', 0, 0);
    const sides = chooseSides(from, to, false);
    expect(sides.startSide).toBe('left');
    expect(sides.endSide).toBe('right');
  });

  it('builds cubic Bezier path matching M … C …', () => {
    const from = makeTable('a', 0, 0);
    const to = makeTable('b', 400, 40);
    const path = buildRelationPath(from, 0, to, 1, 'one-to-many', 'rel_1');
    expect(path.d).toMatch(/^M .+ C .+$/);
  });

  it('assigns ∞/1 labels for one-to-many', () => {
    expect(cardinalityLabels('one-to-many')).toEqual({
      startLabel: '∞',
      endLabel: '1',
    });
  });

  it('assigns 1/1 labels for one-to-one', () => {
    expect(cardinalityLabels('one-to-one')).toEqual({
      startLabel: '1',
      endLabel: '1',
    });
  });

  it('anchor Y follows column index', () => {
    const y0 = columnCenterY(100, 0);
    const y1 = columnCenterY(100, 1);
    expect(y0).toBe(
      100 + TABLE_HEADER_HEIGHT + COLUMN_ROW_HEIGHT / 2,
    );
    expect(y1).toBe(y0 + COLUMN_ROW_HEIGHT);
    expect(y1).toBeGreaterThan(y0);
  });

  it('uses right/left for self-relation', () => {
    const table = makeTable('self', 100, 100, 3);
    const sides = chooseSides(table, table, true);
    expect(sides.startSide).toBe('right');
    expect(sides.endSide).toBe('left');
  });
});
