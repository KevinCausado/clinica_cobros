import * as repo from "./repo.ts";
import { parsePesos, formatoCOP } from "./dinero.ts";
import { registrarAbono, reversarPago, saldoDeFactura, pagadoDeFactura, deudores } from "./facturacion.ts";

const [, , comando, ...resto] = process.argv;
const json = resto.includes("--json");
const args = resto.filter((a) => a !== "--json");

function salida(objeto: unknown, texto: string): void {
  console.log(json ? JSON.stringify(objeto) : texto);
}

function facturaPorId(id: number) {
  const f = repo.facturas().find((x) => x.id === id);
  if (!f) throw new Error(`No existe la factura ${id}`);
  return f;
}

try {
  switch (comando) {
    case "facturas": {
      const pagos = repo.pagos();
      const lista = repo.facturas().map((f) => ({
        id: f.id,
        pacienteId: f.pacienteId,
        estado: f.estado,
        valorTotal: f.valorTotal,
        saldo: saldoDeFactura(f, pagos),
      }));
      salida(lista, lista.map((f) => `#${f.id}  paciente ${f.pacienteId}  ${f.estado}  total ${formatoCOP(f.valorTotal)}  saldo ${formatoCOP(f.saldo)}`).join("\n"));
      break;
    }
    case "saldo": {
      const f = facturaPorId(Number(args[0]));
      const pagos = repo.pagos();
      const r = { facturaId: f.id, valorTotal: f.valorTotal, pagado: pagadoDeFactura(f.id, pagos), saldo: saldoDeFactura(f, pagos) };
      salida(r, `Factura ${f.id}: total ${formatoCOP(r.valorTotal)}, pagado ${formatoCOP(r.pagado)}, saldo ${formatoCOP(r.saldo)}`);
      break;
    }
    case "abonar": {
      // abonar <facturaId> <valor> <metodo> <fecha YYYY-MM-DD>
      const f = facturaPorId(Number(args[0]));
      const pagos = repo.pagos();
      const { pago, saldo } = registrarAbono(f, pagos, parsePesos(args[1]), args[2], args[3]);
      repo.guardarPagos([...pagos, pago]);
      salida({ pagoId: pago.id, facturaId: f.id, saldo }, `Abono ${pago.id} registrado. Nuevo saldo: ${formatoCOP(saldo)}`);
      break;
    }
    case "reversar": {
      const pagos = reversarPago(repo.pagos(), Number(args[0]));
      repo.guardarPagos(pagos);
      salida({ pagoId: Number(args[0]), estado: "REVERSADO" }, `Pago ${args[0]} reversado`);
      break;
    }
    case "deudores": {
      const lista = deudores(repo.pacientes(), repo.facturas(), repo.pagos());
      salida(
        lista.map(({ pacienteId, nombre, saldo }) => ({ pacienteId, nombre, saldo })),
        lista.length
          ? lista.map((d) => `#${d.pacienteId}  ${d.nombre}  doc ${d.documento}  debe ${formatoCOP(d.saldo)}`).join("\n")
          : "No hay pacientes con cuentas pendientes.",
      );
      break;
    }
    default:
      console.log("Comandos: facturas | saldo <id> | abonar <id> <valor> <metodo> <fecha> | reversar <pagoId> | deudores   (agrega --json para salida en JSON)");
  }
} catch (e) {
  console.error("Error:", (e as Error).message);
  process.exit(1);
}
