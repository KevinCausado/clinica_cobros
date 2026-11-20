Mensaje 1 de Caja : «Caja dice que a veces el saldo de la factura no cuadra después de registrar un abono. Pasó con la factura 79, de un paciente de Sanitas.»

Rta : Hola Caja,

Ya encontré por qué el saldo no cuadraba. El problema estaba en cómo el
sistema leía el valor que uno escribe al registrar un abono.

Cuando el valor se escribía con puntos —como 500.000 o 1.500.000— el
sistema solo leía el número que va antes del primer punto. Así, 500.000
quedaba guardado como 500 pesos y 1.500.000 como 1 peso. Por eso el
abono entraba por mucho menos de lo que el paciente pagó y el saldo de
la factura casi no bajaba.

Por eso pasaba "a veces": solo cuando el valor se escribía con puntos.
Si se escribía sin puntos (500000), quedaba bien.

Ya lo corregí. Ahora el sistema entiende los dos formatos (con puntos y
sin puntos) y además rechaza valores que no son un número, como
"12 abc" o un valor negativo, en vez de guardarlos mal.

Qué les pido:

- Revisen la factura 79 (Juan Castro, Sanitas): total $2.500.000 y abono
  de $500.000, así que el saldo debería ser $2.000.000. Si el abono se
  registró con puntos en su momento, puede que haya quedado por menos.
- Si ven otras facturas con abonos escritos con puntos, el saldo pudo
  quedar mal por lo mismo. Con el arreglo ya no vuelve a pasar.

//---------------------------------------------------------

Mensaje 2 de Recepción : «Recepción necesita saber cuáles pacientes tienen cuentas pendientes antes de darles una nueva cita.»

Rta : Hola Recepción,

Les armé un comando para que puedan ver de una los pacientes que deben
dinero, sin tener que abrir factura por factura:

    node src/cli.ts deudores

Muestra una lista con el documento, el nombre y cuánto debe cada
paciente, empezando por el que más debe. Si lo corren con --json
(node src/cli.ts deudores --json) sale la misma información para usarla
desde otro sistema.

Para saber quién debe, sumamos el saldo de todas las facturas EMITIDAS
de cada paciente. Las facturas ANULADAS no se cuentan, y los pagos que
se reversaron tampoco (ese dinero nunca entró). Al final aparece solo
quien tiene saldo mayor que cero; el que ya pagó todo no sale en la lista.

De paso encontré y arreglé un error que hacía que el sistema contara
mal el dinero: cuando se reversaba un pago, el sistema seguía sumándolo
como si se hubiera pagado. Por eso algunos pacientes aparecían con menos
deuda de la que realmente tienen. Ya quedó corregido, así que la lista
de ahora es la buena.

Con los datos de hoy salen 25 pacientes con cuenta pendiente. El que más
debe es Juan Castro, con $4.826.000.

Cosas que tuve que suponer (avísenme si no es así):

- Si un paciente pagó de más en una factura, ese saldo a favor se
  descuenta de lo que debe en sus otras facturas. Es decir, miramos el
  total del paciente, no factura por factura.
- La deuda la mostramos por paciente. Si necesitan también el detalle
  de cada factura, se lo puedo agregar.
