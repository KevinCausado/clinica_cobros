import { test } from "node:test";
import assert from "node:assert/strict";
import { saldoDeFactura, registrarAbono, reversarPago, deudores, recaudoPorMetodo, normalizarMetodo } from "../src/facturacion.ts";
import type { Factura, Paciente, Pago } from "../src/modelo.ts";

const factura: Factura = { id: 1, pacienteId: 1, fecha: "2026-11-02", valorTotal: 200000, estado: "EMITIDA" };
const pago = (id: number, valor: number, estado = "APLICADO"): Pago => ({ id, facturaId: 1, fecha: "2026-11-03", valor, metodo: "EFECTIVO", estado });

test("saldo sin pagos es el total", () => {
  assert.equal(saldoDeFactura(factura, []), 200000);
});
test("saldo descuenta pagos aplicados", () => {
  assert.equal(saldoDeFactura(factura, [pago(1, 50000)]), 150000);
});
test("abono nuevo actualiza el saldo", () => {
  const r = registrarAbono(factura, [pago(1, 50000)], 100000, "Efectivo", "2026-11-04");
  assert.equal(r.saldo, 50000);
});
test("no permite abonar más que el saldo", () => {
  assert.throws(() => registrarAbono(factura, [], 300000, "Efectivo", "2026-11-04"));
});
test("reversar marca el pago como reversado", () => {
  const r = reversarPago([pago(1, 50000)], 1);
  assert.equal(r[0].estado, "REVERSADO");
});

// --- deudores ---
const pacientes: Paciente[] = [
  { id: 1, documento: "100000252", nombre: "Juan Castro", eps: "Sanitas" },
  { id: 2, documento: "100000431", nombre: "Natalia Pérez", eps: null },
];
const f = (id: number, pacienteId: number, valorTotal: number, estado: Factura["estado"] = "EMITIDA"): Factura =>
  ({ id, pacienteId, fecha: "2026-11-02", valorTotal, estado });

test("deudores suma saldos por paciente y ordena de mayor a menor", () => {
  const facturas = [f(1, 1, 200000), f(2, 1, 100000), f(3, 2, 50000)];
  const r = deudores(pacientes, facturas, []);
  assert.deepEqual(r.map((d) => [d.pacienteId, d.saldo]), [[1, 300000], [2, 50000]]);
});
test("deudores ignora facturas anuladas", () => {
  const r = deudores(pacientes, [f(1, 1, 200000, "ANULADA")], []);
  assert.deepEqual(r, []);
});
test("deudores no cuenta pagos reversados", () => {
  const r = deudores(pacientes, [f(1, 1, 200000)], [pago(1, 200000, "REVERSADO")]);
  assert.equal(r[0].saldo, 200000);
});
test("deudores excluye a quien no debe nada", () => {
  const r = deudores(pacientes, [f(1, 1, 200000)], [pago(1, 200000)]);
  assert.deepEqual(r, []);
});
test("deudores netea un sobre-pago contra las demás facturas", () => {
  const facturas = [f(1, 1, 300000), f(2, 1, 100000)];
  const pagos = [pago(1, 200000), { ...pago(2, 130000), facturaId: 2 }];
  const r = deudores(pacientes, facturas, pagos);
  assert.equal(r[0].saldo, 70000); // (300000 - 200000) + (100000 - 130000)
});
test("deudores desempata por pacienteId", () => {
  const facturas = [f(1, 1, 100000), f(2, 2, 100000)];
  const r = deudores(pacientes, facturas, []);
  assert.deepEqual(r.map((d) => d.pacienteId), [1, 2]);
});

// --- recaudo ---
const p = (id: number, fecha: string, valor: number, metodo: string, estado = "APLICADO"): Pago =>
  ({ id, facturaId: 1, fecha, valor, metodo, estado });

test("normalizarMetodo limpia espacios y unifica mayúsculas", () => {
  assert.equal(normalizarMetodo(" efectivo "), "EFECTIVO");
  assert.equal(normalizarMetodo("Nequi"), "NEQUI");
  assert.equal(normalizarMetodo(""), "SIN METODO");
});

test("recaudo agrupa por método normalizado en rango inclusivo", () => {
  const pagos = [
    p(1, "2026-11-09", 100000, "Efectivo "),
    p(2, "2026-11-15", 50000, "EFECTIVO"),
    p(3, "2026-11-09", 30000, "nequi"),
    p(4, "2026-11-08", 999000, "TARJETA"), // fuera del rango
    p(5, "2026-11-16", 999000, "TARJETA"), // fuera del rango
  ];
  const r = recaudoPorMetodo(pagos, "2026-11-09", "2026-11-15");
  assert.deepEqual(r, [
    { metodo: "EFECTIVO", total: 150000 },
    { metodo: "NEQUI", total: 30000 },
  ]);
});

test("recaudo no cuenta pagos reversados", () => {
  const pagos = [p(1, "2026-11-10", 100000, "TARJETA"), p(2, "2026-11-10", 50000, "TARJETA", "REVERSADO")];
  assert.deepEqual(recaudoPorMetodo(pagos, "2026-11-09", "2026-11-15"), [{ metodo: "TARJETA", total: 100000 }]);
});

test("recaudo ignora estados desconocidos (lista blanca APLICADO)", () => {
  const pagos = [p(1, "2026-11-10", 100000, "TARJETA"), p(2, "2026-11-10", 50000, "TARJETA", "PENDIENTE")];
  assert.deepEqual(recaudoPorMetodo(pagos, "2026-11-09", "2026-11-15"), [{ metodo: "TARJETA", total: 100000 }]);
});

test("recaudo usa SIN METODO para método vacío", () => {
  const pagos = [p(1, "2026-11-10", 200000, "")];
  assert.deepEqual(recaudoPorMetodo(pagos, "2026-11-09", "2026-11-15"), [{ metodo: "SIN METODO", total: 200000 }]);
});

test("recaudo ordena alfabéticamente por método", () => {
  const pagos = [p(1, "2026-11-10", 1, "TARJETA"), p(2, "2026-11-10", 1, "EFECTIVO"), p(3, "2026-11-10", 1, "NEQUI")];
  assert.deepEqual(recaudoPorMetodo(pagos, "2026-11-09", "2026-11-15").map((r) => r.metodo), ["EFECTIVO", "NEQUI", "TARJETA"]);
});

test("recaudo rechaza fechas con formato inválido", () => {
  assert.throws(() => recaudoPorMetodo([], "9/11/2026", "2026-11-15"), /YYYY-MM-DD/);
  assert.throws(() => recaudoPorMetodo([], "2026-11-09", "2026-11-9"), /YYYY-MM-DD/);
});

test("recaudo rechaza rango invertido", () => {
  assert.throws(() => recaudoPorMetodo([], "2026-11-15", "2026-11-09"), /posterior/);
});
