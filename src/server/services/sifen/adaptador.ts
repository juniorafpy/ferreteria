/**
 * Adaptador SIFEN desacoplado. La integración real (firma XML, WS SOAP de la SET) se implementa
 * en otra clase que cumpla `AdaptadorSifen`; por defecto se usa el stub que simula aprobación.
 */
export type EstadoSifenRespuesta = 'aprobado' | 'aprobado_con_observacion' | 'rechazado' | 'enviado';

export type DocumentoSifen = {
  cdc: string;
  xml: string;
  ambiente: 'test' | 'produccion';
};

export type RespuestaSifen = {
  estado: EstadoSifenRespuesta;
  codigo: string;
  mensaje: string;
  lote?: string | null;
  requestXml?: string | null;
  responseXml?: string | null;
};

export interface AdaptadorSifen {
  readonly nombre: string;
  enviar(doc: DocumentoSifen): Promise<RespuestaSifen>;
  consultar(cdc: string, ambiente: 'test' | 'produccion'): Promise<RespuestaSifen>;
  cancelar(cdc: string, motivo: string, ambiente: 'test' | 'produccion'): Promise<{ ok: boolean; codigo: string; mensaje: string }>;
}

/** Stub: aprueba todo documento con CDC válido (código 0260 como la SET). */
export class AdaptadorSifenStub implements AdaptadorSifen {
  readonly nombre = 'stub';
  constructor(private readonly opciones: { rechazar?: boolean } = {}) {}

  async enviar(doc: DocumentoSifen): Promise<RespuestaSifen> {
    if (this.opciones.rechazar || !/^\d{44}$/.test(doc.cdc)) {
      return { estado: 'rechazado', codigo: '0160', mensaje: 'XML mal formado (simulado)', requestXml: doc.xml };
    }
    return {
      estado: 'aprobado',
      codigo: '0260',
      mensaje: 'Autorización del DE satisfactoria (simulado)',
      lote: `STUB-${Date.now()}`,
      requestXml: doc.xml,
      responseXml: `<rRetEnviDe><dCodRes>0260</dCodRes><Id>${doc.cdc}</Id></rRetEnviDe>`,
    };
  }

  async consultar(cdc: string): Promise<RespuestaSifen> {
    return { estado: 'aprobado', codigo: '0422', mensaje: `CDC ${cdc} encontrado (simulado)` };
  }

  async cancelar(cdc: string, motivo: string) {
    return { ok: true, codigo: '0600', mensaje: `Evento de cancelación registrado (simulado) ${cdc}: ${motivo}` };
  }
}

let actual: AdaptadorSifen = new AdaptadorSifenStub();

export const getAdaptadorSifen = (): AdaptadorSifen => actual;
/** Permite inyectar la integración real (o un mock en pruebas). */
export const setAdaptadorSifen = (a: AdaptadorSifen) => {
  actual = a;
};
