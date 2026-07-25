# 09 — Acceptance Criteria & Definition of Done

Чеклист приёмки. Генератор после завершения работ **обязан** пройти каждый пункт. Пункт провален → доработать код, не оправдываться.

---

## 9.1 Build & Run

- [ ] `npm install` завершается без ошибок
- [ ] `npm start` / `ng serve` поднимает приложение
- [ ] Консоль браузера без ошибок runtime при старте
- [ ] Нет красных ошибок Angular (NG0xxx) в консоли
- [ ] Zoneless: drag таблицы / правки inspector обновляют SVG и SQL без Zone.js hacks
- [ ] В зависимостях нет three / ngrx / chart.js / d3 / cytoscape / dagre / jointjs / monaco-editor
- [ ] Если Tailwind не подключён — SCSS variables тема работает; если подключён — конфиг полный

---

## 9.2 Shell & layout

- [ ] Трёхпанельный CSS Grid: tools | canvas | inspector
- [ ] Toolbar с брендом SQL-Forge, dialect, theme, lang, help, reset view
- [ ] Status bar показывает tables / columns / relations / zoom / dialect
- [ ] Responsive stack на узком viewport не ломает canvas полностью

---

## 9.3 Schema CRUD

- [ ] На старте загружен preset `blog` (≥2 таблицы, ≥1 relation)
- [ ] «Создать таблицу» добавляет таблицу со стартовыми колонками
- [ ] Rename table / column через inspector обновляет UI и SQL
- [ ] Смена типа колонки и флагов PK/NN/UQ отражается в DDL
- [ ] PK exclusivity: включение PK на другой колонке снимает PK с прежней
- [ ] Delete column / table работает; последняя колонка не удаляется без замены
- [ ] Delete table каскадно удаляет связанные relations

---

## 9.4 Relations & link tool

- [ ] Link-handle → drag → drop на чужую колонку создаёт Relation
- [ ] From-колонка получает `foreignKey: true`
- [ ] One-to-many по умолчанию; смена kind в inspector работает
- [ ] One-to-one выставляет `unique` на from-колонке
- [ ] Дубликат той же пары не создаётся
- [ ] Escape / drop в пустоту отменяет link mode
- [ ] Удаление relation снимает FK, если исходящих больше нет
- [ ] SQL содержит `ALTER TABLE … FOREIGN KEY … REFERENCES …`

---

## 9.5 SVG geometry & navigation

- [ ] Связи — cubic Bezier (`M … C …`), не единственные прямые line
- [ ] При горизонтальном разнесении таблиц выбираются nearest left/right sides
- [ ] Маркеры `1` / `∞` (O2M) или `1` / `1` (O2O) видны у концов
- [ ] Drag таблицы обновляет позицию и пути связей плавно
- [ ] Pan средней кнопкой мыши перемещает viewport
- [ ] Zoom колесом к курсору в пределах min/max
- [ ] Reset view возвращает zoom/pan к дефолтам
- [ ] Grid background виден на холсте
- [ ] Selection подсвечивает table / column / relation

---

## 9.6 SQL generator

- [ ] PostgreSQL: двойные кавычки идентификаторов; `UUID` как `UUID`
- [ ] MySQL: backticks; `UUID` → `CHAR(36)`; `BOOLEAN` → `TINYINT(1)`
- [ ] Порядок: все `CREATE TABLE`, затем `ALTER … FK`
- [ ] Таблицы эмитятся в стабильном порядке по имени
- [ ] Пустая схема даёт `-- Empty schema` (или эквивалент из 04) без краша
- [ ] «Скопировать» копирует текущий SQL и показывает toast

---

## 9.7 Presets / i18n / theme / hotkeys

- [ ] Presets `blog` / `ecommerce` / `auth` / `empty` загружаются и reset'ят view
- [ ] i18n RU↔EN переключает видимые строки (`G` вне input)
- [ ] Theme toggle пишет `data-theme` (`T` вне input)
- [ ] Help drawer открывается `?` и закрывается Escape
- [ ] Hotkeys zoom (`Ctrl+=/-`, `Ctrl+0`) работают
- [ ] Delete/Backspace удаляет выбранную таблицу вне полей ввода
- [ ] `Ctrl/Cmd+Shift+C` копирует SQL вне полей ввода

---

## 9.8 Tests

- [ ] `npm test` (или эквивалент) проходит для обязательных specs из документа 07
- [ ] relation-geometry.spec / sql-builder.spec / table-metrics.spec / schema-state.service.spec / sql-generator.service.spec зелёные

---

## 9.9 Code quality

- [ ] Нет `// TODO`, `// ...`, `// аналогично`, `// логика аналогична`
- [ ] Нет `*ngIf`, `*ngFor`, `*ngSwitch`
- [ ] Нет BehaviorSubject/Subject для schema/UI state
- [ ] Геометрия Bezier и SQL assembly живут в `domain/schema`, не в шаблонах
- [ ] Чеклист [08-file-checklist.md](08-file-checklist.md) выполнен на 100%
- [ ] Канонические пути брифа существуют под точными именами

---

## 9.10 Финальная декларация

После выполнения всех пунктов генератор кратко сообщает:

1. Как запустить (`npm install`, `npm start`, `npm test`).
2. Как проверить J1–J5 из документа 01.
3. Что пакет `docs/` считается исполненным.

Приложение **не готово**, пока любой чекбокс §9.1–§9.9 остаётся ложным.
