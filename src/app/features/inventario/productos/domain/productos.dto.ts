// ! LISTAR
export interface ProductoDTO {
  id: number;
  sku: string;
  codigoBarras: string;
  nombre: string;
  tipoProducto: string;
  marcaNombre?: string;
  categoriaNombre?: string;
  precioVenta: number;
  tipoControlStock?: string;
  activo: boolean;
}

// ! CREAR Y EDITAR
export interface ProductoUpSertDTO {
  nombre?: string;
  marcaId?: number;
  tipoProducto?: string;
  codigoBarras?: string;
  sku?: string;
  codigoInterno?: string;
  categoriaId?: number;
  unidadId?: number;
  descripcion?: string;

  // ! UNIDADES Y PRECIOS
  monedaId?: string;
  precioCompra?: number;
  precioVenta?: number;
  precioMinimoVenta?: number;

  presentaciones?: PresentacionesUpSertDTO[];

  // ! CONFIGURACIÓN
  codigoAfectacionIgv?: string;
  porcentajeIgv?: number;
  controlarStock?: boolean;
  stockMinimo?: number;
  stockMaximo?: number;
  tipoControlStock?: string;
  activoTiendaOnline?: boolean;

  // ! STOCK DE APERTURA
  stockApertura?: StockAperturaUpSertDTO;
}

interface PresentacionesUpSertDTO {
  unidadId: number;
  precioVenta: number;
  factorConversionBase: number;
  codigoBarras: string;
  esPrincipal: boolean;
}

interface StockAperturaUpSertDTO {
  almacenId: number;
  cantidad: number;
  lote?: string;           // Solo si tipoControlStock es LOTE
  fechaVencimiento?: string; // Solo si tipoControlStock es LOTE
  series?: string[];        // Solo si tipoControlStock es SERIE
}

export interface ProductoViewDTO {
  id: number;
  nombre: string;
  marcaId: number;
  tipoProducto: string;
  codigoBarras: string;
  sku: string;
  codigoInterno: string;
  categoriaId: number;
  unidadId: number;
  descripcion: string;

  monedaId: string;
  precioCompra: number;
  precioVenta: number;
  precioMinimoVenta: number;

  codigoAfectacionIgv: string;
  porcentajeIgv: number;
  controlarStock: boolean;
  stockMinimo: number;
  stockMaximo: number;
  tipoControlStock: string;
  activoTiendaOnline: boolean;

  impuestoIcbper: number;
  permitirVentaSinStock: boolean;
  registroSanitario: string;
  condicionVenta: string;
  laboratorioId: number;
  accionFarmacologicaId: number;
  imagenUrl: string;
  stockApertura: StockAperturaUpSertDTO;
  editable: boolean;

  presentaciones: PresentacionesUpSertDTO[];
}
