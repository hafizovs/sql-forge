import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { HelpDrawerComponent } from './shared/help-drawer/help-drawer.component';
import { InspectorPanelComponent } from './features/inspector/inspector-panel/inspector-panel.component';
import { StatusBarComponent } from './core/layout/status-bar/status-bar.component';
import { SvgCanvasComponent } from './features/canvas/svg-canvas/svg-canvas.component';
import { ToastComponent } from './shared/toast/toast.component';
import { ToolbarComponent } from './core/layout/toolbar/toolbar.component';
import { ToolsPanelComponent } from './features/inspector/tools-panel/tools-panel.component';
import { HotkeysService } from './core/hotkeys.service';
import { UiStore } from './core/ui/ui.store';

@Component({
  selector: 'sf-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ToolbarComponent,
    ToolsPanelComponent,
    SvgCanvasComponent,
    InspectorPanelComponent,
    StatusBarComponent,
    HelpDrawerComponent,
    ToastComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  readonly ui = inject(UiStore);
  private readonly hotkeys = inject(HotkeysService);

  ngOnInit(): void {
    this.hotkeys.start();
  }
}
