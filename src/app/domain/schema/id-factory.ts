let seq = 0;

export function createId(kind: 'tbl' | 'col' | 'rel'): string {
  seq += 1;
  const stamp = Date.now().toString(36);
  const n = seq.toString(36);
  if (kind === 'tbl') {
    return `tbl_${stamp}_${n}`;
  }
  if (kind === 'col') {
    return `col_${stamp}_${n}`;
  }
  return `rel_${stamp}_${n}`;
}

export function resetIdFactoryForTests(): void {
  seq = 0;
}

export function createStableId(kind: 'tbl' | 'col' | 'rel', key: string): string {
  if (kind === 'tbl') {
    return `tbl_${key}`;
  }
  if (kind === 'col') {
    return `col_${key}`;
  }
  return `rel_${key}`;
}
