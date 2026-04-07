export interface DocumentTypeBasic {
  code: string;
  abbreviation: string;
  name: string;
  maxLength: number;
  numeric: boolean;
}


export interface Role {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  tenantId?: number;
}
