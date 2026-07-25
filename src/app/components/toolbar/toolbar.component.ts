import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { I18nService } from '../../services/i18n.service';
import { UiStore } from '../../state/ui.store';
import type { SqlDialect } from '../../models/schema.types';

@Component({
  selector: 'sf-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  readonly i18n = inject(I18nService);
  readonly ui = inject(UiStore);

  readonly dialect = this.ui.sqlDialect;
  readonly theme = this.ui.theme;
  readonly locale = this.ui.locale;

  readonly dialectLabel = computed(() =>
    this.dialect() === 'postgresql'
      ? this.i18n.t('toolbar.postgresql')
      : this.i18n.t('toolbar.mysql'),
  );

  setDialect(value: string): void {
    if (value === 'postgresql' || value === 'mysql') {
      this.ui.setDialect(value as SqlDialect);
    }
  }

  toggleTheme(): void {
    this.ui.toggleTheme();
  }

  toggleLocale(): void {
    this.ui.toggleLocale();
  }

  resetView(): void {
    this.ui.resetView();
  }

  openHelp(): void {
    this.ui.setHelpOpen(true);
  }
}
