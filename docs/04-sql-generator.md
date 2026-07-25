# 04 — SQL Generator (DDL Engine)

Реализуй транслятор схемы → DDL **точно** по этому документу и [appendix-b-formulas.md](appendix-b-formulas.md) §B.1–B.5. Не заменяй генератор шаблонными заглушками. Не пропускай `FOREIGN KEY` constraints.

Главный сервис: `sql-generator.service.ts`; чистая логика — в `domain/schema/sql-builder.ts`.

---

## 4.1 Файлы

| Файл | Назначение |
|------|------------|
| `domain/schema/sql-builder.ts` | `generateSql(snapshot, dialect): string` |
| `domain/schema/sql-builder.spec.ts` | oracles PG/MySQL, порядок statements, quoting |
| `services/sql-generator.service.ts` | DI-обёртка; метод `generate(snapshot, dialect)` |
| `core/constants/sql.constants.ts` | type maps, default VARCHAR length, indent |

---

## 4.2 Public API

```ts
export function generateSql(
  snapshot: SchemaSnapshot,
  dialect: SqlDialect,
): string;

// service
@Injectable({ providedIn: 'root' })
export class SqlGeneratorService {
  generate(snapshot: SchemaSnapshot, dialect: SqlDialect): string;
}
```

Сервис **только** делегирует в `generateSql`. Никакой DOM / clipboard логики здесь.

---

## 4.3 Порядок генерации (канон)

1. Заголовок-комментарий: `-- SQL-Forge DDL` + dialect + timestamp optional (канон: **без** динамического timestamp в тестах — либо фиксированная строка, либо параметр `options.includeTimestamp` default `false` для детерминизма; в UI можно `true`).
2. Для каждой таблицы в **стабильном порядке** (сортировка по `name` ASC case-insensitive, tie-break по `id`):
   - `CREATE TABLE … (` колонки `);`
3. Пустая строка-разделитель.
4. Для каждой relation в стабильном порядке (по `id`):
   - `ALTER TABLE … ADD CONSTRAINT … FOREIGN KEY (…) REFERENCES … (…);`
5. Финальный `\n` в конце файла/строки.

Не эмить `DROP` в v1.

---

## 4.4 CREATE TABLE

### Идентификаторы
- PostgreSQL: `"ident"` (двойные кавычки), escape `"` → `""`.
- MySQL: `` `ident` `` (backticks), escape `` ` `` → `` `` ``.
- Helper: `quoteIdent(name, dialect)`.

### Типы колонок

| ColumnDataType | PostgreSQL | MySQL |
|----------------|------------|-------|
| `INT` | `INTEGER` | `INT` |
| `VARCHAR` | `VARCHAR(n)` | `VARCHAR(n)` |
| `UUID` | `UUID` | `CHAR(36)` |
| `BOOLEAN` | `BOOLEAN` | `TINYINT(1)` |
| `TIMESTAMP` | `TIMESTAMP` | `TIMESTAMP` |

`n` = `column.length ?? DEFAULT_VARCHAR_LENGTH` (Appendix A).

### Флаги в определении колонки
Порядок фрагментов после типа:
1. `NOT NULL` если `notNull || primaryKey` (PK подразумевает NOT NULL).
2. `UNIQUE` если `unique && !primaryKey` (PK уже уникален).
3. Inline `PRIMARY KEY` **только** если ровно одна PK-колонка — **канон: inline** на колонке PK.
4. Не пиши `REFERENCES` inline — FK только через `ALTER TABLE` (единообразие).

Пример PostgreSQL:

```sql
CREATE TABLE "users" (
  "id" UUID NOT NULL PRIMARY KEY,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "created_at" TIMESTAMP NOT NULL
);
```

### Отступы
- Indent 2 spaces.
- Запятая в конце каждой колонки кроме последней.
- Пустая схема (0 tables) → комментарий `-- Empty schema` и пустая строка (не ошибка).

---

## 4.5 ALTER TABLE FOREIGN KEY

```sql
ALTER TABLE "posts"
  ADD CONSTRAINT "fk_posts_user_id"
  FOREIGN KEY ("user_id")
  REFERENCES "users" ("id");
```

Имя constraint (канон):
```
fk_{fromTable}_{fromColumn}
```
Если коллизия имён (редко) — суффикс `_{shortRelationId}`. Санитизируй: только `[a-zA-Z0-9_]`, lowercase.

Для MySQL — те же statements с backtick-квотами.

`ON DELETE` / `ON UPDATE` в v1 **не** генерировать (можно добавить позже; не блокирует DoD).

---

## 4.6 One-to-One

При `kind === 'one-to-one'` SQL тот же FK ALTER; уникальность обеспечивается флагом `unique` на from-колонке (уже в CREATE). Не добавляй отдельный UNIQUE CONSTRAINT statement, если флаг уже отражён в колонке.

---

## 4.7 Валидация перед генерацией

`generateSql` **не бросает** на «мягких» проблемах:
- Битая relation (table/column missing) — **пропустить** relation + optional comment `-- skipped broken relation {id}`.
- Пустое имя таблицы/колонки — подставить `_unnamed` / `_col` и всё равно эмитить (UI должен мешать раньше).

Жёсткие ошибки (неожиданный dialect) — throw в domain; сервис ловит и возвращает `-- Error: …` **или** пробрасывает — **канон: вернуть строку с комментарием ошибки**, UI не падает.

---

## 4.8 Интеграция со state

В `SchemaStateService` (или UI computed):

```ts
readonly sqlText = computed(() =>
  this.sqlGenerator.generate(
    { tables: this.tables(), relations: this.relations() },
    this.uiStore.sqlDialect(),
  ),
);
```

Inspector / `SqlPreviewComponent` читает `sqlText()`; кнопка Copy использует `ClipboardService`.

---

## 4.9 Тестовые oracles (минимум)

См. также 07 и Appendix B. Обязательные кейсы:
1. Одна таблица `users` с PK UUID + email VARCHAR UNIQUE → ожидаемый CREATE (snapshot-строка).
2. `posts.user_id` → `users.id` one-to-many → CREATE обеих + один ALTER FK.
3. Dialect switch меняет `UUID`→`CHAR(36)` и квоты.
4. Пустая схема → `-- Empty schema`.
5. Стабильный порядок: таблицы `b`, `a` эмитятся как `a` затем `b`.
