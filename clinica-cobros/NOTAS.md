## Herramientas que usé
- **OpenCode** (IA local), configurado con permisos en "preguntar":
  no podía editar archivos ni ejecutar comandos sin que yo aprobara.
  Lo usé en modo "plan" para analizar y en modo "build" solo para
  aplicar cambios que ya había revisado.


FLujo de trabajo Inicial con repositorio
  - Crear repositorio en github
  - inicializar repositorio local con *git init*
  - Agregar archivos con  *git add .*
  - crear rama **main** con *git branch -M main*
  - subir rama original **main** con commit inicial *git commit -m "Codigo original"*
  - validar estado cambios con *git status*
  - crear rama para fix de los requerimientos con *git switch -c solucion*


Flujo de trabajo manual para Mensaje 1
 - validar tests por mi cuenta, me di cuenta que en teoria todo funcionaba, un falso positivo

 - validar con IA el posible falso positivo de lo tests , IA detecto posible hueco en dinero.ts, en la funcion *parsePesos*
 - Di permisos de ejecucion para validar tests propuso 3 posibles soluciones a ese problema
  

 Diagnostico IA
  -*parsePesos*, corta los numeros cuando se ingresan con decimales, es decir si ingreso 90.000 se ingresa como 90 y claro si se 
  valida el saldo con *node -e src/saldo.ts 79* se puede validar lo que deberia tener el sistema, la ia me planteo otros posibles bugs valide si influian
  a futuro dijo que Si
   
  - ingreso de numeros negativos, la funcion dejaba pasar esos datos *-5000*, entra como *-5000* pero registrarAbono de cli.ts lo detiene
  - No exige que todo sea numero, puede entrar *12 abc* entra como *12*

************************************************************
Flujo de trabajo manual para Mensaje 2


   