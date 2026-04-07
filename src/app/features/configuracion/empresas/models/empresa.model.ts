export interface Empresa {
  tenantId: number;
  razonSocial: string;
  ruc: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  tipoEmpresa: string | null;
  empresaPrincipal: boolean;
  activo: boolean;
}
