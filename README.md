# Prueba técnica — Módulo de caja (`clinica-cobros`)

Resolución de los tres mensajes del área sobre un sistema de facturación y pagos
ya existente: un saldo que no cuadraba (Caja), la necesidad de listar pacientes
con cuentas pendientes (Recepción) y un reporte de recaudo semanal por método de
pago (Facturación).

## Contenido del repositorio

| Ruta | Qué contiene |
|---|---|
| `clinica-cobros/` | El proyecto (TypeScript, sin dependencias externas) |
| `clinica-cobros/NOTAS.md` | Proceso seguido: diagnóstico de cada caso, decisiones y verificación |
| `clinica-cobros/RESPUESTAS.md` | Respuesta a cada área, en lenguaje no técnico |
| `clinica-cobros/README.md` | Uso del sistema: comandos, pantalla web y datos |

## Requisitos

Node.js 22.6 o superior (probado en 22.18). No hay que instalar dependencias.

## Cómo ejecutar

```bash
cd clinica-cobros

npm test        # 24 pruebas automatizadas
npm run web     # pantalla en http://localhost:3000
```

Línea de comandos:

```bash
node src/cli.ts facturas
node src/cli.ts saldo 79
node src/cli.ts deudores
node src/cli.ts recaudo --desde 2026-11-09 --hasta 2026-11-15
```

Cualquier comando acepta `--json` para obtener la salida en JSON.

## Qué se resolvió

1. **Caja — el saldo no cuadraba.** `parsePesos` cortaba el valor en el primer
   punto: `1.500.000` se guardaba como 1. Ahora entiende el formato con separador
   de miles y rechaza lo que no es un número.
2. **Recepción — cuentas pendientes.** Nuevo comando `deudores`. De paso se
   corrigió un filtro que comparaba contra `REVERTIDO` cuando el estado real es
   `REVERSADO`, por lo que los pagos reversados seguían contando como pagados.
3. **Facturación — recaudo por método.** Nuevo comando `recaudo` con rango de
   fechas inclusivo, normalización del método de pago (venía como texto libre) y
   exclusión de los pagos reversados.

## Cómo verificarlo

- `npm test`: pruebas de cálculo de saldo, abonos, reversos, deudores,
  normalización de métodos, rango de fechas y errores de entrada.
- Con los datos de ejemplo: saldo de la factura 79 ($2.000.000), 25 pacientes
  con cuenta pendiente (el mayor, $4.826.000) y recaudo de la semana del 9 al
  15 de noviembre de 2026 ($2.750.000).

## Flujo de trabajo

El commit inicial conserva el código original. Sobre él, los tres casos están en
commits separados (uno por mensaje), de modo que cada cambio se puede revisar de
forma independiente, y un commit final con la documentación.

El uso de herramientas de IA está declarado en `clinica-cobros/NOTAS.md`, junto
con el criterio aplicado: la herramienta se usó para analizar y proponer, y cada
cambio se revisó, se explicó y se respaldó con una prueba antes de aceptarlo.
