import { Injectable, inject } from '@angular/core';
import { I18nService } from './i18n.service';
import { UiStore } from './ui/ui.store';

@Injectable({ providedIn: 'root' })
export class ClipboardService {
  private readonly i18n = inject(I18nService);
  private readonly ui = inject(UiStore);

  async copyText(text: string): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        this.ui.showToast(this.i18n.t('toast.copied'));
        return true;
      }
      const ok = this.fallbackCopy(text);
      if (ok) {
        this.ui.showToast(this.i18n.t('toast.copied'));
        return true;
      }
      this.ui.showToast(this.i18n.t('toast.copyFailed'));
      return false;
    } catch {
      this.ui.showToast(this.i18n.t('toast.copyFailed'));
      return false;
    }
  }

  private fallbackCopy(text: string): boolean {
    if (typeof document === 'undefined') {
      return false;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
  }
}
