import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { I18nService } from '../../i18n.service';
import { SchemaStateService } from '../../../features/canvas/schema-state.service';
import { UiStore } from '../../ui/ui.store';

@Component({
  selector: 'sf-status-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './status-bar.component.html',
  styleUrl: './status-bar.component.scss',
})
export class StatusBarComponent {
  readonly i18n = inject(I18nService);
  readonly schema = inject(SchemaStateService);
  readonly ui = inject(UiStore);

  readonly tableCount = computed(() => this.schema.tables().length);
  readonly columnCount = computed(() =>
    this.schema.tables().reduce((sum, t) => sum + t.columns.length, 0),
  );
  readonly relationCount = computed(() => this.schema.relations().length);
  readonly zoomPercent = computed(() => Math.round(this.ui.zoom() * 100));
  readonly dialectLabel = computed(() =>
    this.ui.sqlDialect() === 'postgresql'
      ? this.i18n.t('toolbar.postgresql')
      : this.i18n.t('toolbar.mysql'),
  );
}
