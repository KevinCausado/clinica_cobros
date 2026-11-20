## Herramientas que usé

- **OpenCode** (IA local), configurado con permisos en "preguntar": no
  podía editar archivos ni ejecutar comandos sin que yo aprobara. Lo usé
  en modo "plan" para analizar y en modo "build" solo para aplicar
  cambios que ya había revisado.
- **Node.js 22.18+** para correr el CLI y las pruebas.
- **Git** para el control de versiones.

## Flujo de trabajo con el repositorio

- Crear repositorio en GitHub.
- Inicializar repositorio local con `git init`.
- Agregar archivos con `git add .`.
- Crear rama **main** con `git branch -M main`.
- Commit inicial: `git commit -m "Codigo original"`.
- Validar estado con `git status`.
- Crear rama para el fix: `git switch -c solucion`.

## Mensaje 1 — Caja

«Caja dice que a veces el saldo de la factura no cuadra después de
registrar un abono. Pasó con la factura 79, de un paciente de Sanitas.»

### Cómo lo investigué

1. Corrí las pruebas (`npm test`) y en teoría todo pasaba: un falso
   positivo.
2. Revisé con la IA el posible hueco y apuntó a `dinero.ts`, en la
   función `parsePesos`.
3. Reproduje el bug comparando el código viejo con el nuevo:

   | Lo que escribe Caja | Antes guardaba | Ahora guarda |
   |---------------------|----------------|--------------|
   | `500.000`           | 500            | 500000       |
   | `1.500.000`         | 1              | 1500000      |
   | `90.000`            | 90             | 90000        |
   | `500000`            | 500000         | 500000       |
   | `12 abc`            | 12             | rechazado    |
   | `-5000`             | -5000          | rechazado    |

### Diagnóstico

`parsePesos` cortaba el número en el primer punto. Si Caja escribía
`90.000`, entraba como 90; si escribía `1.500.000`, entraba como 1. Por
eso el abono quedaba por mucho menos y el saldo no bajaba lo que debía.
Solo pasaba "a veces" porque con valores sin puntos (`90000`) funcionaba
bien.

La IA también planteó otros dos casos, que dejé cubiertos:

- números negativos (`-5000`): antes pasaban; ahora se rechazan.
- texto mezclado (`12 abc`): antes entraba como 12; ahora se rechaza.

### Qué cambié

- `src/dinero.ts`: `parsePesos` ahora acepta enteros y valores con
  separador de miles (`1.500.000`, `1,500,000`), y rechaza lo que no es
  un número.
- `tests/dinero.test.ts`: prueba nueva `parsePesos ignora puntos`.

### Verificación

- `npm test` → 10 pruebas, todas pasan (en ese momento el proyecto tenía
  10: 5 de `dinero.test.ts` y 5 de `facturacion.test.ts`).
- `node src/cli.ts saldo 79` → total $2.500.000, pagado $500.000, saldo
  $2.000.000.

## Mensaje 2 — Recepción

«Recepción necesita saber cuáles pacientes tienen cuentas pendientes
antes de darles una nueva cita.»

### Cómo lo investigué

1. Validé con la IA distintas opciones. La regla que acordamos: un
   paciente tiene cuenta pendiente si la suma de los saldos de sus
   facturas emitidas es mayor que cero.

   ```
   saldo_paciente = Σ (valorTotal − pagos_aplicados)   sobre facturas EMITIDA
   ```

   Se excluyen las facturas ANULADA y los pagos REVERSADO.

2. Analizando el cálculo, la IA detectó un bug: en `facturacion.ts` el
   filtro usaba `REVERTIDO`, pero el estado real en `pagos.json` es
   `REVERSADO`. Los estados posibles son `APLICADO` y `REVERSADO`.

   En lenguaje claro: no se reversaba nada y el pago revertido seguía
   sumando como pagado.

3. La IA planteó 3 opciones y escogí la más útil para el mostrador:
   `deudores` (lista de pacientes que deben) más una consulta por
   documento.

### Qué cambié

- `src/facturacion.ts`: corregí el filtro (`REVERSADO`) y agregué la
  función `deudores`.
- `src/cli.ts`: nuevo comando `deudores` (con `--json`).
- `tests/facturacion.test.ts`: 6 pruebas para `deudores` (anuladas,
  reversados, empate, sobre-pago, etc.).

### Verificación

- `npm test` → 16 pruebas, todas pasan.
- `node src/cli.ts deudores` → 25 pacientes con cuenta pendiente; el
  mayor es Juan Castro con $4.826.000.
- `node src/cli.ts deudores --json` → lista de objetos
  `{"pacienteId":1,"nombre":"Juan Castro","saldo":4826000}`.

## Mensaje 3 — Facturación

Pendiente.
