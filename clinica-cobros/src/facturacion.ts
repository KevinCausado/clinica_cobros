import type { Factura, Paciente, Pago } from "./modelo.ts";

/** Total pagado de una factura (dinero que realmente entró). */
export function pagadoDeFactura(facturaId: number, pagos: Pago[]): number {
  return pagos
    .filter((p) => p.facturaId === facturaId && p.estado !== "REVERSADO")
    .reduce((suma, p) => suma + p.valor, 0);
}

export function saldoDeFactura(factura: Factura, pagos: Pago[]): number {
  return factura.valorTotal - pagadoDeFactura(factura.id, pagos);
}

export interface ResultadoAbono {
  pago: Pago;
  saldo: number;
}

/** Registra un abono sobre una factura y devuelve el nuevo saldo. */
export function registrarAbono(
  factura: Factura,
  pagos: Pago[],
  valor: number,
  metodo: string,
  fecha: string,
): ResultadoAbono {
  if (factura.estado !== "EMITIDA") {
    throw new Error("La factura no está emitida");
  }
  if (!Number.isInteger(valor) || valor <= 0) {
    throw new Error("El valor del abono debe ser un entero positivo");
  }
  if (valor > saldoDeFactura(factura, pagos)) {
    throw new Error("El abono supera el saldo de la factura");
  }
  const id = pagos.reduce((m, p) => Math.max(m, p.id), 0) + 1;
  const pago: Pago = { id, facturaId: factura.id, fecha, valor, metodo, estado: "APLICADO" };
  const nuevos = [...pagos, pago];
  return { pago, saldo: saldoDeFactura(factura, nuevos) };
}

/** Reversa un pago: queda en el historial pero deja de contar. */
export function reversarPago(pagos: Pago[], pagoId: number): Pago[] {
  const pago = pagos.find((p) => p.id === pagoId);
  if (!pago) throw new Error(`No existe el pago ${pagoId}`);
  if (pago.estado === "REVERSADO") throw new Error("El pago ya estaba reversado");
  return pagos.map((p) => (p.id === pagoId ? { ...p, estado: "REVERSADO" } : p));
}

export interface Deudor {
  pacienteId: number;
  nombre: string;
  documento: string;
  saldo: number;
}

/**
 * Pacientes con cuenta pendiente (saldo > 0), mayor deuda primero.
 * El saldo es la suma de los saldos de sus facturas emitidas: un sobre-pago
 * en una factura se netea contra las demás (crédito a favor del paciente).
 */
export function deudores(pacientes: Paciente[], facturas: Factura[], pagos: Pago[]): Deudor[] {
  const saldoPorPaciente = new Map<number, number>();
  for (const f of facturas) {
    if (f.estado !== "EMITIDA") continue;
    const actual = saldoPorPaciente.get(f.pacienteId) ?? 0;
    saldoPorPaciente.set(f.pacienteId, actual + saldoDeFactura(f, pagos));
  }
  return pacientes
    .map((p) => ({
      pacienteId: p.id,
      nombre: p.nombre,
      documento: p.documento,
      saldo: saldoPorPaciente.get(p.id) ?? 0,
    }))
    .filter((d) => d.saldo > 0)
    .sort((a, b) => b.saldo - a.saldo || a.pacienteId - b.pacienteId);
}
