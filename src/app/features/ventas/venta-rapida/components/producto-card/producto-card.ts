import { Component, computed, input, Output, EventEmitter, output } from '@angular/core';
import { ProductCard } from '@ventas/venta-rapida/domains/venta-rapida.interface';

@Component({
  selector: 'app-producto-card',
  standalone: true,
  imports: [],
  templateUrl: './producto-card.html',
  styleUrl: './producto-card.scss',
})
export class ProductoCard {
  productData = input<ProductCard | null>(null);
  loading = input<boolean>(false);
  add = output();

  readonly hasData = computed(() => !!this.productData());

  readonly normalized = computed(() => {
    const p = this.productData();
    const code = (p?.CODIGO ?? '').toString().trim();
    const name = (p?.NOMBRE ?? '').toString().trim();
    const lab = (p?.LABORATORIO_NOMBRE ?? '').toString().trim() || null;
    const stock = typeof p?.STOCK === 'number' && Number.isFinite(p.STOCK) ? p.STOCK : null;
    const priceBox =
      typeof p?.PRECIO_CAJA === 'number' && Number.isFinite(p.PRECIO_CAJA) ? p.PRECIO_CAJA : null;
    const priceUnit =
      typeof p?.PRECIO_UNIDAD === 'number' && Number.isFinite(p.PRECIO_UNIDAD)
        ? p.PRECIO_UNIDAD
        : null;

    return {
      code: code || null,
      name: name || null,
      lab,
      stock,
      priceBox,
      priceUnit,
    };
  });

  readonly errors = computed(() => {
    const p = this.normalized();
    const errs: string[] = [];

    if (!p.code) errs.push('MISSING_CODE');
    if (!p.name) errs.push('MISSING_NAME');
    if (p.stock != null && p.stock < 0) errs.push('INVALID_STOCK');
    if (p.priceBox != null && p.priceBox < 0) errs.push('INVALID_PRICE_BOX');
    if (p.priceUnit != null && p.priceUnit < 0) errs.push('INVALID_PRICE_UNIT');

    return errs;
  });

  readonly hasErrors = computed(() => this.errors().length > 0);

  formatMoney(value: number | null) {
    if (value == null) return '—';
    return `S/ ${value.toFixed(2)}`;
  }

  handleAdd() {
    if (this.loading() || !this.hasData() || this.hasErrors()) return;
    this.add.emit();
  }
}
