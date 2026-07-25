import { describe, expect, it } from 'vitest';
import type { SchemaSnapshot } from '../../models/schema.types';
import { generateSql } from './sql-builder';

const usersOnly: SchemaSnapshot = {
  tables: [
    {
      id: 'tbl_users',
      name: 'users',
      x: 0,
      y: 0,
      columns: [
        {
          id: 'col_id',
          name: 'id',
          dataType: 'UUID',
          primaryKey: true,
          foreignKey: false,
          notNull: true,
          unique: false,
        },
        {
          id: 'col_email',
          name: 'email',
          dataType: 'VARCHAR',
          primaryKey: false,
          foreignKey: false,
          notNull: true,
          unique: true,
          length: 255,
        },
      ],
    },
  ],
  relations: [],
};

const blogLike: SchemaSnapshot = {
  tables: [
    {
      id: 'tbl_users',
      name: 'users',
      x: 0,
      y: 0,
      columns: [
        {
          id: 'col_users_id',
          name: 'id',
          dataType: 'UUID',
          primaryKey: true,
          foreignKey: false,
          notNull: true,
          unique: false,
        },
      ],
    },
    {
      id: 'tbl_posts',
      name: 'posts',
      x: 300,
      y: 0,
      columns: [
        {
          id: 'col_posts_id',
          name: 'id',
          dataType: 'UUID',
          primaryKey: true,
          foreignKey: false,
          notNull: true,
          unique: false,
        },
        {
          id: 'col_posts_user_id',
          name: 'user_id',
          dataType: 'UUID',
          primaryKey: false,
          foreignKey: true,
          notNull: true,
          unique: false,
        },
      ],
    },
  ],
  relations: [
    {
      id: 'rel_1',
      fromTableId: 'tbl_posts',
      fromColumnId: 'col_posts_user_id',
      toTableId: 'tbl_users',
      toColumnId: 'col_users_id',
      kind: 'one-to-many',
    },
  ],
};

describe('sql-builder', () => {
  it('emits CREATE for a single table (PostgreSQL)', () => {
    const sql = generateSql(usersOnly, 'postgresql');
    expect(sql).toContain('-- SQL-Forge DDL (postgresql)');
    expect(sql).toContain('CREATE TABLE "users" (');
    expect(sql).toContain('"id" UUID NOT NULL PRIMARY KEY');
    expect(sql).toContain('"email" VARCHAR(255) NOT NULL UNIQUE');
  });

  it('emits CREATE + ALTER FK for related tables', () => {
    const sql = generateSql(blogLike, 'postgresql');
    expect(sql).toContain('CREATE TABLE "posts"');
    expect(sql).toContain('CREATE TABLE "users"');
    expect(sql).toContain('ALTER TABLE "posts"');
    expect(sql).toContain('FOREIGN KEY ("user_id")');
    expect(sql).toContain('REFERENCES "users" ("id")');
  });

  it('switches types and quoting for MySQL', () => {
    const sql = generateSql(usersOnly, 'mysql');
    expect(sql).toContain('CREATE TABLE `users` (');
    expect(sql).toContain('`id` CHAR(36) NOT NULL PRIMARY KEY');
    expect(sql).not.toContain('"users"');
  });

  it('returns empty schema comment', () => {
    expect(generateSql({ tables: [], relations: [] }, 'postgresql')).toBe(
      '-- Empty schema\n',
    );
  });

  it('emits tables in stable name order', () => {
    const snapshot: SchemaSnapshot = {
      tables: [
        {
          id: 'tbl_b',
          name: 'b',
          x: 0,
          y: 0,
          columns: [
            {
              id: 'col_b',
              name: 'id',
              dataType: 'INT',
              primaryKey: true,
              foreignKey: false,
              notNull: true,
              unique: false,
            },
          ],
        },
        {
          id: 'tbl_a',
          name: 'a',
          x: 0,
          y: 0,
          columns: [
            {
              id: 'col_a',
              name: 'id',
              dataType: 'INT',
              primaryKey: true,
              foreignKey: false,
              notNull: true,
              unique: false,
            },
          ],
        },
      ],
      relations: [],
    };
    const sql = generateSql(snapshot, 'postgresql');
    const idxA = sql.indexOf('CREATE TABLE "a"');
    const idxB = sql.indexOf('CREATE TABLE "b"');
    expect(idxA).toBeGreaterThanOrEqual(0);
    expect(idxB).toBeGreaterThan(idxA);
  });

  it('skips broken relations with comment', () => {
    const snapshot: SchemaSnapshot = {
      tables: usersOnly.tables,
      relations: [
        {
          id: 'rel_broken',
          fromTableId: 'missing',
          fromColumnId: 'x',
          toTableId: 'tbl_users',
          toColumnId: 'col_id',
          kind: 'one-to-many',
        },
      ],
    };
    const sql = generateSql(snapshot, 'postgresql');
    expect(sql).toContain('-- skipped broken relation rel_broken');
  });
});
