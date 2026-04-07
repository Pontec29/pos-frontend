import { ProveedorCreateDTO, ProveedorDTO } from "./proveedor.dto";
import { Proveedor, ProveedorCrear } from "./proveedor.interface";

export class ProveedorAdapter {
  static adapt(dto: ProveedorDTO): Proveedor {
    return {
      ID_PROVEEDOR: dto.id,
      RUC: dto.numeroDocumento,
      RAZONSOCIAL: dto.razonSocial,
      NOMBRE_PROVEEDOR: dto.nombreComercial,
      ACTIVO: dto.activo
    };
  }

  static adaptToCreate(form: ProveedorCrear): ProveedorCreateDTO {
     // Lógica para determinar tipo de documento (1=DNI, 6=RUC)
    const docLength = form.NUMERO_DOCUMENTO ? form.NUMERO_DOCUMENTO.length : 0;
    const tipoDocumento = docLength === 8 ? '01' : '06';

    return {
      tipoDocCodigo: tipoDocumento,
      numeroDocumento: form.NUMERO_DOCUMENTO,
      nombres: form.NOMBRES,
      apellidos: form.APELLIDOS,
      direccionFiscal: form.DIRECCION,
      ubigeoId: form.ID_UBIGEO,
      email: form.EMAIL,
      telefonoPrincipal: form.TELEFONO_PRINCIPAL,
      telefonoSecundario: form.TELEFONO_SECUNDARIO || undefined,
      razonSocial: form.RAZON_SOCIAL || undefined,
      nombreComercial: form.NOMBRE_COMERCIAL || undefined
    };
  }
}
