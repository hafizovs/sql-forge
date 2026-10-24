## Live demo

https://hafizovs.github.io/sql-forge/

# SQL-Forge

Interactive SVG database designer on Angular (zoneless, Signals). Tables and relationships on a canvas, with live DDL for PostgreSQL / MySQL.

Specification: [`../docs`](../docs).

## About

SQL-Forge is an interactive SVG database designer on Angular with zoneless change detection and Signals. You place tables and relationships on a canvas and read live DDL for PostgreSQL or MySQL. The workbench is three panes: tools, the SVG canvas, and an inspector with SQL.

## Capabilities

- Three-pane workbench: tools | SVG canvas | inspector + SQL
- Drag tables, pan with the middle button, zoom with the wheel toward the cursor
- Relationships as cubic Beziers with `1` / `∞` markers
- Link tool (a column’s link handle onto another column)
- Presets: blog, ecommerce, auth, empty
- RU/EN, theme toggle, and hotkeys

## Functionality

- Create a table with `N`, and delete a table or relationship with Delete or Backspace
- Drag tables, pan with the middle mouse button, and zoom toward the cursor; reset the view with Ctrl/Cmd+0
- Start a link from a column handle and drop it on a column
- Switch PostgreSQL and MySQL with `D`, and copy SQL with Ctrl/Cmd+Shift+C
- Load a blog, ecommerce, auth, or empty preset; toggle language (`G`) and theme (`T`); `?` opens help and Esc clears the selection, an in-progress link, or help

## Start

```bash
npm install
npm start
```

Open `http://localhost:4200/`.

## Tests

```bash
npm test
```

## Features

- Three-pane workbench: tools | SVG canvas | inspector + SQL
- Drag tables, middle-button pan, wheel zoom toward the cursor
- Relationships as cubic Beziers with `1` / `∞` markers
- Link tool (column link-handle → column)
- Presets: blog, ecommerce, auth, empty
- i18n RU/EN, theme toggle, hotkeys

## Hotkeys

| Key | Action |
|---------|----------|
| `N` | Create a table |
| `Delete` / `Backspace` | Delete a table / relationship |
| `Ctrl/Cmd+Shift+C` | Copy SQL |
| `Ctrl/Cmd+0` | Reset the view |
| `Ctrl/Cmd+=` / `-` | Zoom in / out |
| `G` | Language RU↔EN |
| `T` | Theme |
| `D` | Dialect PG↔MySQL |
| `?` | Help |
| `Esc` | Clear selection / link / help |
