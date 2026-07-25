export type RelationKind = 'one-to-one' | 'one-to-many';

export const RELATION_KINDS: readonly RelationKind[] = [
  'one-to-one',
  'one-to-many',
] as const;
