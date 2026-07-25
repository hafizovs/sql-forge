# SQL-Forge

Интерактивный SVG-конструктор баз данных на Angular (zoneless, Signals). Таблицы и связи на холсте, live DDL для PostgreSQL / MySQL.

Спецификация: [`../docs`](../docs).

## Запуск

```bash
npm install
npm start
```

Откройте `http://localhost:4200/`.

## Тесты

```bash
npm test
```

## Возможности

- Трёхпанельный workbench: tools | SVG canvas | inspector + SQL
- Drag таблиц, pan средней кнопкой, zoom колесом к курсору
- Связи — cubic Bezier с маркерами `1` / `∞`
- Инструмент «Связать» (link-handle колонки → колонка)
- Пресеты: blog, ecommerce, auth, empty
- i18n RU/EN, theme toggle, hotkeys

## Hotkeys

| Клавиша | Действие |
|---------|----------|
| `N` | Создать таблицу |
| `Delete` / `Backspace` | Удалить таблицу / связь |
| `Ctrl/Cmd+Shift+C` | Копировать SQL |
| `Ctrl/Cmd+0` | Сброс вида |
| `Ctrl/Cmd+=` / `-` | Zoom in / out |
| `G` | Язык RU↔EN |
| `T` | Тема |
| `D` | Диалект PG↔MySQL |
| `?` | Справка |
| `Esc` | Сброс selection / link / help |
