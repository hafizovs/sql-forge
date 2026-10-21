import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { I18nService } from '../../../core/i18n.service';

@Component({
  selector: 'sf-sql-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sql-preview.component.html',
  styleUrl: './sql-preview.component.scss',
})
export class SqlPreviewComponent {
  readonly i18n = inject(I18nService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly sql = input.required<string>();
  readonly copy = output<void>();

  readonly highlighted = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.highlightSql(this.sql())),
  );

  onCopy(): void {
    this.copy.emit();
  }

  private highlightSql(sql: string): string {
    const escaped = sql
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
    return escaped
      .replace(
        /\b(CREATE|TABLE|ALTER|ADD|CONSTRAINT|FOREIGN|KEY|REFERENCES|PRIMARY|NOT|NULL|UNIQUE)\b/g,
        '<span class="sf-sql-kw">$1</span>',
      )
      .replace(
        /\b(INTEGER|INT|VARCHAR\(\d+\)|UUID|CHAR\(\d+\)|BOOLEAN|TINYINT\(\d+\)|TIMESTAMP)\b/g,
        '<span class="sf-sql-type">$1</span>',
      );
  }
}
