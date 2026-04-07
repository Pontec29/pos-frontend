import { Component, signal, computed, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ProductoCard } from './components/producto-card/producto-card';
import { MessageService } from 'primeng/api';
import { ProductCard } from './domains/venta-rapida.interface';
import { ProductoService } from '@inventario/productos/services/producto.service';
import { ModalVenta } from './components/modal-venta/modal-venta';
import { FilterAdvanceProducto } from './components/filter-advance-producto/filter-advance-producto';
import { FilterAdvanceProductos } from './domains/venta-rapida.interface';
import { CategoriaService } from '@inventario/categoria/services/categoria.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Categoria } from '@inventario/categoria/domain/categoria.interface';
import { catchError, map, of } from 'rxjs';

@Component({
  selector: 'app-venta-rapida',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    SelectButtonModule,
    InputNumberModule,
    DialogModule,
    ProgressSpinnerModule,
    ProductoCard,
    ModalVenta,
    FilterAdvanceProducto,
  ],
  templateUrl: './venta-rapida.component.html',
  styleUrls: ['./venta-rapida.component.scss'],
})
export default class VentaRapidaComponent {
  private readonly messageService = inject(MessageService);
  private readonly productoService = inject(ProductoService);
  private readonly categoriasService = inject(CategoriaService);

  // ! RESOLUTION
  readonly isMobil = signal<boolean>(false);

  // ! BLOQUEO MOBILE
  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobil.set(window.innerWidth < 800);
  }

  // ! DATA LISTER
  products = signal<ProductCard[]>([]);
  hasData = computed(() => this.products().length > 0);
  selectedCategory = signal<string>('TODAS');

  categoriasData = toSignal(
    this.categoriasService.getAll(true).pipe(
      map((res) => res.data ?? []),
      map((categorias) =>
        categorias
          .filter((categoria) => categoria.ACTIVO)
          .sort((a, b) => a.NOMBRE.localeCompare(b.NOMBRE, 'es', { sensitivity: 'base' })),
      ),
      catchError((err) => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: err.message ?? 'No se pudieron cargar las categorías.',
        });
        return of([] as Categoria[]);
      }),
    ),
    { initialValue: [] as Categoria[] },
  );

  categoriesForChips = computed(() => {
    const allOption = { id: 0, name: 'TODAS', count: this.products().length };
    const chips = this.categoriasData().map((categoria) => {
      const count = this.products().filter(
        (p) => (p.CATEGORIA_NOMBRE ?? '').toLowerCase() === categoria.NOMBRE.toLowerCase(),
      ).length;

      return {
        id: categoria.ID_CATEGORIA,
        name: categoria.NOMBRE,
        count,
      };
    });

    return [allOption, ...chips];
  });

  // ! LOADING AND ERRORs
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);
  errorMessage = signal<string>('');

  // ! SEARCH AND FILTERS
  searchQuery = signal('');
  filterAdvanced = signal<boolean>(false);

  filteredProducts = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const category = this.selectedCategory();

    return this.products().filter((p) => {
      const matchesQuery =
        p.NOMBRE.toLowerCase().includes(query) ||
        p.CODIGO.toLowerCase().includes(query) ||
        (p.LABORATORIO_NOMBRE && p.LABORATORIO_NOMBRE.toLowerCase().includes(query));
      const matchesCategory =
        category === 'TODAS' || (p.CATEGORIA_NOMBRE ?? '').toLowerCase() === category.toLowerCase();

      return matchesQuery && matchesCategory;
    });
  });

  setCategory(categoryName: string) {
    this.selectedCategory.set(categoryName);
  }

  handleAdvancedFilter(payload: FilterAdvanceProductos) {
    this.messageService.add({
      severity: 'success',
      summary: 'Filtros aplicados',
      detail: `Filtros: Cat:${payload.ID_CATEGORIA} | Lab:${payload.ID_LABORATORIO} | Pres:${payload.ID_PRESENTACION}`,
    });
    // TODO: Llamar al servicio con el payload
    // this.productoService.getAll(true, payload).subscribe(...)
  }

  ngOnInit(): void {
    this.loadData();
    this.checkScreenSize();
  }

  private loadData() {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.errorMessage.set('');

    this.productoService.getAll(true).subscribe({
      next: (res) => {
        this.products.set(
          res.data.map((p) => ({
            ID_PRODUCTO: p.ID_PRODUCTO,
            CODIGO: p.SKU,
            NOMBRE: p.NOMBRE,
              CATEGORIA_NOMBRE: p.CATEGORIA_NOMBRE,
            LABORATORIO_NOMBRE: p.MARCA_NOMBRE,
            STOCK: 50,
            PRECIO_CAJA: 10,
            PRECIO_UNIDAD: 1,
          })),
        );
      },
      error: (err) => {
        this.products.set([]);
        this.hasError.set(true);
        this.errorMessage.set(err.message);
        this.messageService.add({
          severity: 'warn',
          summary: 'Advertencia',
          detail: err.message,
        });
      },
      complete: () => {
        this.isLoading.set(false);
      },
    });
  }

  // ! CARRITO LOGIC
  cart = signal<any[]>([]);

  cartSubtotal = computed(() => {
    return this.cart().reduce((sum, item) => {
      const price = item.isBox ? item.product.priceBox : item.product.priceUnit;
      return sum + price * item.quantity;
    }, 0);
  });

  cartIgv = computed(() => {
    return this.cartSubtotal() * 0.18;
  });

  cartTotal = computed(() => {
    return this.cartSubtotal() + this.cartIgv();
  });

  addToCart(product: ProductCard) {
    this.cart.update((items) => {
      const isBoxDefault = product.PRECIO_CAJA > 0;

      const existing = items.find(
        (i) => i.product.id === product.ID_PRODUCTO && i.isBox === isBoxDefault,
      );
      if (existing) {
        if (existing.quantity < this.maxQuantity(existing)) {
          existing.quantity++;
        }
        return [...items];
      }

      const newItem = {
        id: crypto.randomUUID(),
        product: {
          id: product.ID_PRODUCTO,
          name: product.NOMBRE,
          code: product.CODIGO,
          priceBox: product.PRECIO_CAJA,
          priceUnit: product.PRECIO_UNIDAD,
          stock: product.STOCK,
        },
        isBox: isBoxDefault,
        quantity: 1,
      };

      return [...items, newItem];
    });
  }

  confirmRemoveFromCart(item: any) {
    this.cart.update((items) => items.filter((i) => i.id !== item.id));
  }

  setUnit(item: any, isBox: boolean) {
    this.cart.update((items) => {
      const idx = items.findIndex((i) => i.id === item.id);
      if (idx !== -1) {
        items[idx].isBox = isBox;
      }
      return [...items];
    });
  }

  updateQuantity(item: any, qty: number) {
    this.cart.update((items) => {
      const idx = items.findIndex((i) => i.id === item.id);
      if (idx !== -1) {
        items[idx].quantity = qty;
      }
      return [...items];
    });
  }

  maxQuantity(item: any): number {
    return item.product.stock;
  }

  formatPrice(val: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
  }

  openPayment() {
    // Abrir modal de venta
    this.messageService.add({ severity: 'info', summary: 'Finalizar', detail: 'abrir modal...' });
  }
}
