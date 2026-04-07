export interface ExternalApiData {
    tipoDocumento: string;
    numeroDocumento: string;

    // DNI
    nombres?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    nombreCompleto?: string;

    // RUC
    razonSocial?: string;
    direccion?: string;
    ubigeo?: string;
    distrito?: string;
    provincia?: string;
    departamento?: string;
    estado?: string;
    condicion?: string;
}
