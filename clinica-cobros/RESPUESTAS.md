
Mensaje 1 de caja : «Caja dice que a veces el saldo de la factura no cuadra después de registrar un abono. Pasó con la
factura 79, de un paciente de Sanitas.»

Rta : Hola Caja,

Encontré por qué el saldo no cuadraba. Cuando se escribía un valor con
puntos, como 1.500.000 o 90.000, el sistema leía solo lo que está antes
del primer punto. Por ejemplo, 90.000 quedaba registrado como 90 pesos
y 1.500.000 como 1 peso. Por eso el saldo de la factura 79 no bajaba lo
que debía.

Lo pasaba "a veces" porque solo ocurría cuando el valor se escribía con
puntos. Si lo escribían sin puntos (90000), funcionaba bien.

posibles acciones : 

- Revisen el saldo de la factura 79: debería ser el total menos lo que
  el paciente realmente pagó.


//---------------------------------------------------------



