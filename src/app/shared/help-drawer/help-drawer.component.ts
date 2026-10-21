import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { I18nService } from '../../core/i18n.service';
import { UiStore } from '../../core/ui/ui.store';

@Component({
  selector: 'sf-help-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './help-drawer.component.html',
  styleUrl: './help-drawer.component.scss',
})
export class HelpDrawerComponent {
  readonly i18n = inject(I18nService);
  readonly ui = inject(UiStore);

  readonly hotkeys = [
    { keys: 'N', action: 'tools.createTable' },
    { keys: 'Delete / Backspace', action: 'inspector.deleteTable' },
    { keys: 'Ctrl/Cmd+Shift+C', action: 'sql.copy' },
    { keys: 'Ctrl/Cmd+0', action: 'toolbar.resetView' },
    { keys: 'Ctrl/Cmd+= / -', action: 'status.zoom' },
    { keys: 'G', action: 'toolbar.lang' },
    { keys: 'T', action: 'toolbar.theme' },
    { keys: 'D', action: 'toolbar.dialect' },
    { keys: '?', action: 'toolbar.help' },
    { keys: 'Esc', action: 'help.close' },
  ] as const;

  close(): void {
    this.ui.setHelpOpen(false);
  }
}
