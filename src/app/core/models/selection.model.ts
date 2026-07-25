export type SelectionKind = 'table' | 'column' | 'relation' | 'none';

export interface SelectionState {
  kind: SelectionKind;
  tableId: string | null;
  columnId: string | null;
  relationId: string | null;
}
