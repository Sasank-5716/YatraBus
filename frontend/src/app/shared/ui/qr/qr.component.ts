import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { encode } from '../../util/qr-encoder';

/** QR code as an SVG element: `<svg ybQr [text]="…" [px]="4"></svg>` (byte mode, ECC M — same output as v5 QR.svg). */
@Component({
  selector: 'svg[ybQr]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'xmlns': 'http://www.w3.org/2000/svg', 'shape-rendering': 'crispEdges', 'role': 'img', 'aria-label': 'QR code',
    '[attr.viewBox]': '"0 0 " + size() + " " + size()', '[attr.width]': 'size() * px()', '[attr.height]': 'size() * px()',
  },
  template: `<svg:rect width="100%" height="100%" fill="#fff"/><svg:path [attr.d]="path()" [attr.fill]="color()"/>`,
})
export class QrComponent {
  readonly text = input.required<string>();
  readonly px = input(4);
  readonly color = input('#0b1b33');
  private readonly matrix = computed(() => encode(this.text()) as boolean[][]);
  readonly size = computed(() => this.matrix().length + 8);
  readonly path = computed(() => {
    let p = ''; this.matrix().forEach((row, y) => row.forEach((on, x) => { if (on) p += `M${x + 4} ${y + 4}h1v1h-1z`; })); return p;
  });
}
