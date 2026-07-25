export type SqlDialect = 'postgresql' | 'mysql';

export const SQL_DIALECTS: readonly SqlDialect[] = [
  'postgresql',
  'mysql',
] as const;
