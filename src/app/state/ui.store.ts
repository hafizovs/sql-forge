import { Injectable, effect, signal } from '@angular/core';
import {
  PAN_DEFAULT_X,
  PAN_DEFAULT_Y,
  ZOOM_DEFAULT,
  ZOOM_MAX,
  ZOOM_MIN,
} from '../core/constants/canvas.constants';
import {
  DEFAULT_LOCALE,
  DEFAULT_SQL_DIALECT,
  DEFAULT_THEME,
} from '../core/constants/schema.constants';
import { TOAST_DURATION_MS } from '../core/constants/ui.constants';
import { clamp } from '../domain/math/clamp';
import type {
  LinkModeState,
  LocaleId,
  Point,
  SqlDialect,
  ThemeId,
} from '../models/schema.types';

@Injectable({ providedIn: 'root' })
export class UiStore {
  readonly theme = signal<ThemeId>(DEFAULT_THEME);
  readonly locale = signal<LocaleId>(DEFAULT_LOCALE);
  readonly sqlDialect = signal<SqlDialect>(DEFAULT_SQL_DIALECT);
  readonly helpOpen = signal(false);
  readonly toastMessage = signal<string | null>(null);
  readonly linkMode = signal<LinkModeState | null>(null);
  readonly zoom = signal(ZOOM_DEFAULT);
  readonly panX = signal(PAN_DEFAULT_X);
  readonly panY = signal(PAN_DEFAULT_Y);

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const theme = this.theme();
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
      }
    });
  }

  toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  setTheme(theme: ThemeId): void {
    this.theme.set(theme);
  }

  toggleLocale(): void {
    this.locale.update((l) => (l === 'ru' ? 'en' : 'ru'));
  }

  setLocale(locale: LocaleId): void {
    this.locale.set(locale);
  }

  setDialect(dialect: SqlDialect): void {
    this.sqlDialect.set(dialect);
  }

  toggleDialect(): void {
    this.sqlDialect.update((d) =>
      d === 'postgresql' ? 'mysql' : 'postgresql',
    );
  }

  toggleHelp(): void {
    this.helpOpen.update((v) => !v);
  }

  setHelpOpen(open: boolean): void {
    this.helpOpen.set(open);
  }

  showToast(message: string): void {
    this.toastMessage.set(message);
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set(null);
      this.toastTimer = null;
    }, TOAST_DURATION_MS);
  }

  clearToast(): void {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    this.toastMessage.set(null);
  }

  beginLink(state: LinkModeState): void {
    this.linkMode.set(state);
  }

  updateLinkCursor(cursorWorld: Point): void {
    this.linkMode.update((mode) =>
      mode ? { ...mode, cursorWorld } : mode,
    );
  }

  cancelLink(): void {
    this.linkMode.set(null);
  }

  setZoomPan(zoom: number, panX: number, panY: number): void {
    this.zoom.set(clamp(zoom, ZOOM_MIN, ZOOM_MAX));
    this.panX.set(panX);
    this.panY.set(panY);
  }

  setZoom(zoom: number): void {
    this.zoom.set(clamp(zoom, ZOOM_MIN, ZOOM_MAX));
  }

  setPan(panX: number, panY: number): void {
    this.panX.set(panX);
    this.panY.set(panY);
  }

  zoomBy(factor: number): void {
    this.zoom.update((z) => clamp(z * factor, ZOOM_MIN, ZOOM_MAX));
  }

  resetView(): void {
    this.zoom.set(ZOOM_DEFAULT);
    this.panX.set(PAN_DEFAULT_X);
    this.panY.set(PAN_DEFAULT_Y);
  }
}
