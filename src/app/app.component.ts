import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { HelpDrawerComponent } from './components/help-drawer/help-drawer.component';
import { InspectorPanelComponent } from './components/inspector-panel/inspector-panel.component';
import { StatusBarComponent } from './components/status-bar/status-bar.component';
import { SvgCanvasComponent } from './components/svg-canvas/svg-canvas.component';
import { ToastComponent } from './components/toast/toast.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { ToolsPanelComponent } from './components/tools-panel/tools-panel.component';
import { HotkeysService } from './services/hotkeys.service';
import { UiStore } from './state/ui.store';

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
