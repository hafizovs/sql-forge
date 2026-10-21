import { DestroyRef, Injectable, inject } from '@angular/core';
import { ClipboardService } from './clipboard.service';
import { SchemaStateService } from '../features/canvas/schema-state.service';
import { UiStore } from './ui/ui.store';
import { ZOOM_MAX, ZOOM_MIN } from './constants/canvas.constants';
import { clamp } from '../domain/math/clamp';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }
  return target.isContentEditable;
}

@Injectable({ providedIn: 'root' })
export class HotkeysService {
  private readonly schema = inject(SchemaStateService);
  private readonly ui = inject(UiStore);
  private readonly clipboard = inject(ClipboardService);
  private readonly destroyRef = inject(DestroyRef);
  private attached = false;

  start(): void {
    if (this.attached || typeof window === 'undefined') {
      return;
    }
    const handler = (event: KeyboardEvent) => this.onKeyDown(event);
    window.addEventListener('keydown', handler);
    this.attached = true;
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('keydown', handler);
      this.attached = false;
    });
  }

  private onKeyDown(event: KeyboardEvent): void {
    const editable = isEditableTarget(event.target);
    const key = event.key;
    const lower = key.toLowerCase();
    const mod = event.ctrlKey || event.metaKey;

    if (key === 'Escape') {
      if (this.ui.linkMode()) {
        this.ui.cancelLink();
        event.preventDefault();
        return;
      }
      if (this.ui.helpOpen()) {
        this.ui.setHelpOpen(false);
        event.preventDefault();
        return;
      }
      this.schema.clearSelection();
      event.preventDefault();
      return;
    }

    if ((key === 'Delete' || key === 'Backspace') && !editable) {
      const relationId = this.schema.selectedRelationId();
      if (relationId) {
        this.schema.removeRelation(relationId);
        event.preventDefault();
        return;
      }
      const tableId = this.schema.selectedTableId();
      if (tableId && !this.schema.selectedColumnId()) {
        this.schema.removeTable(tableId);
        event.preventDefault();
      }
      return;
    }

    if (editable) {
      return;
    }

    if (mod && event.shiftKey && lower === 'c') {
      void this.clipboard.copyText(this.schema.sqlText());
      event.preventDefault();
      return;
    }

    if (mod && (key === '0' || key === ')')) {
      this.ui.resetView();
      event.preventDefault();
      return;
    }

    if (mod && (key === '=' || key === '+')) {
      this.ui.setZoom(clamp(this.ui.zoom() * 1.1, ZOOM_MIN, ZOOM_MAX));
      event.preventDefault();
      return;
    }

    if (mod && key === '-') {
      this.ui.setZoom(clamp(this.ui.zoom() / 1.1, ZOOM_MIN, ZOOM_MAX));
      event.preventDefault();
      return;
    }

    if (lower === 'n') {
      this.schema.addTable();
      event.preventDefault();
      return;
    }

    if (lower === 'g') {
      this.ui.toggleLocale();
      event.preventDefault();
      return;
    }

    if (lower === 't') {
      this.ui.toggleTheme();
      event.preventDefault();
      return;
    }

    if (lower === 'd') {
      this.ui.toggleDialect();
      event.preventDefault();
      return;
    }

    if (key === '?' || (event.shiftKey && key === '/')) {
      this.ui.toggleHelp();
      event.preventDefault();
    }
  }
}
