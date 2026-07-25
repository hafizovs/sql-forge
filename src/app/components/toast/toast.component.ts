import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { UiStore } from '../../state/ui.store';

@Component({
  selector: 'sf-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
})
export class ToastComponent {
  readonly ui = inject(UiStore);
}
