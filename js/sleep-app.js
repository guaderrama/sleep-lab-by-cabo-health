/*
 * SLEEP_LAB "My Sleep": initial check, one-minute diary, regularity, "My night"
 * planner, self-guided 6-week program, night tools and data backup.
 * Everything is stored on the device (localStorage key 'sleepLabData').
 * Logic lives in js/sleep-core.js; this file is only UI.
 */
(function () {
  'use strict';
  var C = window.SleepCore;
  var root = document.getElementById('sl-root');
  var homeCta = document.getElementById('home-sleep-cta');
  if (!C || !root) return;

  var STORE_KEY = 'sleepLabData';
  var data = load();
  var ui = { modal: null, opener: null, form: null, check: null, night: null, shuffle: null, pacer: null, toastTimer: null, saveWarned: false };

  // =====================================================================
  // Text (Spanish first, English second)
  // =====================================================================
  var STR = {
    es: {
      'title': 'Mi sueño',
      'subtitle': 'Tu diario, tu plan de noche y tu programa. Todo se guarda solo en este teléfono, sin cuenta.',
      'disclaimer': 'Herramienta educativa de autoayuda. No sustituye atención médica.',
      'close': 'Cerrar', 'back': 'Atrás', 'next': 'Siguiente', 'save': 'Guardar', 'cancel': 'Cancelar', 'edit': 'Editar', 'delete': 'Borrar', 'open': 'Abrir',
      'saved': 'Guardado', 'err.save': 'No se pudo guardar en este navegador. Revisa que no estés en modo privado.',
      'minutes': '{n} min', 'hours': '{h} h', 'hm': '{h} h {m} min',
      'evidence': 'En qué se basa',

      // home card
      'home.badge': 'Nuevo', 'home.title': 'Mi sueño: un plan hecho a tu medida',
      'home.start': 'Responde 2 minutos de preguntas y te decimos por dónde empezar: optimizar, reiniciar tu sueño o una ruta suave.',
      'home.startBtn': 'Empezar el chequeo', 'home.log': '¿Cómo dormiste anoche? Regístralo en un minuto.', 'home.logBtn': 'Registrar mi noche',
      'home.program': 'Semana {w} de 6 · Esta noche: acuéstate no antes de las {bed} y levántate a las {rise}',
      'home.baseline': 'Semana de registro: llevas {n} de 7 noches.', 'home.openBtn': 'Abrir Mi sueño',
      'home.night': 'Esta noche: acuéstate a las {bed}{cafe}', 'home.cafe': ' · último café: {t}',

      // check
      'check.cta.title': 'Empieza aquí', 'check.cta.text': 'Un chequeo de 2 minutos elige tu ruta. No es un diagnóstico: solo decide qué herramientas te sirven más.',
      'check.cta.btn': 'Hacer el chequeo (2 min)', 'check.redo': 'Repetir chequeo', 'check.title': 'Chequeo de sueño',
      'check.q.main': '¿Qué describe mejor tus noches?',
      'check.main.good': 'Duermo bien, quiero dormir mejor', 'check.main.onset': 'Tardo mucho en dormirme',
      'check.main.maintenance': 'Me despierto de noche o muy temprano', 'check.main.unrefreshed': 'Duermo, pero despierto cansado',
      'check.q.nights': '¿Cuántas noches a la semana te pasa?', 'check.nights.few': '1 o 2 noches', 'check.nights.most': '3 o más noches',
      'check.q.duration': '¿Desde cuándo te pasa?', 'check.duration.lt3m': 'Menos de 3 meses', 'check.duration.gt3m': '3 meses o más',
      'check.q.senior': '¿Tienes 65 años o más?', 'yes': 'Sí', 'no': 'No',
      'check.q.flags': 'Marca lo que te aplique', 'check.flags.help': 'Puedes no marcar nada. Sirve para cuidar que el plan sea seguro para ti.',
      'flag.snore': 'Roncas fuerte o alguien te ha visto dejar de respirar dormido',
      'flag.drowsy': 'Te has quedado dormido manejando o en un momento peligroso',
      'flag.riskyJob': 'Manejas por trabajo o haces trabajo de riesgo (maquinaria, alturas)',
      'flag.shift': 'Trabajas de noche o en turnos rotativos',
      'flag.pregnant': 'Estás embarazada',
      'flag.seizure': 'Tienes epilepsia o convulsiones',
      'flag.mood': 'Trastorno bipolar, psicosis o pensamientos de hacerte daño',
      'flag.parasomnia': 'Sonambulismo u otras conductas raras mientras duermes',
      'flag.falls': 'Te has caído en el último año o te cuesta caminar seguro de noche',
      'flag.shortTIB': 'Ya pasas menos de 6 horas en la cama',
      'flag.rls': 'Molestia en las piernas al estar quieto en la noche, que se alivia al moverlas',
      'check.seeResult': 'Ver mi ruta',
      'route.optimize': 'Ruta Optimizar', 'route.reset': 'Ruta Reiniciar', 'route.gentle': 'Ruta suave',
      'route.optimize.text': 'Ya duermes razonablemente bien. Lo que más rinde ahora es la regularidad, la luz y una tarde bien planeada.',
      'route.reset.text': 'Te conviene el programa de 6 semanas: es el enfoque con más evidencia para dormirse antes y despertarse menos.',
      'route.reset.acute': 'Como empezó hace menos de 3 meses, empieza con un plan breve. Muchas veces basta.',
      'route.gentle.text': 'Mejoras sin recortar tu tiempo en cama: horario fijo, herramientas para la mente y tu plan de noche.',
      'route.gentle.why': 'Por algo que marcaste, esta ruta no usa la ventana de sueño: recortar el tiempo en cama da más sueño de día las primeras semanas.',
      'route.steps': 'Lo que más te sirve:',
      'route.optimize.1': 'Levántate a la misma hora todos los días (±30 min), también en fin de semana.',
      'route.optimize.2': 'Apunta a dormir 7 a 9 horas (7 a 8 si tienes 65 o más).',
      'route.optimize.3': 'Sal a la luz del día en tu primera hora y baja las luces 3 horas antes de dormir.',
      'route.optimize.4': 'Registra tus noches un par de semanas para ver tu regularidad.',
      'route.gentle.1': 'Levántate a la misma hora todos los días.',
      'route.gentle.2': 'Ve a la cama cuando tengas sueño, no solo cansancio.',
      'route.gentle.3': 'Si no duermes, siéntate con luz tenue y regresa a la cama con sueño. No camines a oscuras.',
      'route.gentle.4': 'Usa "Cierra el día" y "Mente tranquila" cuando la cabeza no se apaga.',
      'note.apnea': 'Roncar fuerte con pausas al respirar es una señal típica de apnea del sueño, que esta app no puede evaluar.',
      'note.drowsy': 'Quedarse dormido manejando es peligroso: si tienes sueño, no manejes.',
      'note.rls': 'Las molestias en las piernas que empeoran en reposo y de noche, y se alivian al moverte, son típicas del síndrome de piernas inquietas, que esta app no puede evaluar.',
      'note.crisis': 'Si tienes pensamientos de hacerte daño, busca ayuda hoy: en México, Línea de la Vida 800 911 2000 (gratis, 24 h); en EE. UU., llama o escribe al 988; en una emergencia, 911.',

      // acute plan
      'acute.title': 'Plan breve para insomnio reciente',
      'acute.1': 'Mantén fija tu hora de levantarte, aunque hayas dormido mal.',
      'acute.2': 'No compenses quedándote más tiempo en la cama ni acostándote más temprano.',
      'acute.3': 'Si no te duermes en unos 20 minutos, levántate y regresa cuando tengas sueño.',
      'acute.4': 'Evita siestas de más de 30 minutos.',
      'acute.5': 'Registra tus noches. Si en 3 o 4 semanas sigue igual, empieza el programa de 6 semanas.',
      'acute.ev': 'Una sola sesión con estas reglas logró 60 % de remisión contra 15 % al mes, en un estudio pequeño (40 personas).',
      'acute.startProgram': 'Empezar el programa de 6 semanas',

      // program
      'prog.title': 'Programa Reinicio · 6 semanas',
      'prog.intro': 'Primero registras 7 noches tal como duermes hoy. Con eso calculamos tu ventana de sueño y cada semana la ajustamos con tus datos.',
      'prog.startBaseline': 'Empezar: registra 7 noches',
      'prog.baseline.title': 'Semana de registro', 'prog.baseline.text': 'Registra cada mañana. No cambies nada todavía.',
      'prog.baseline.count': 'Noches registradas en los últimos 7 días: {n} de 7 (mínimo 5).',
      'prog.baseline.ready': 'Calcular mi ventana', 'prog.cancel': 'Salir del programa',
      'prog.week': 'Semana {w} de 6', 'prog.window': 'Tu ventana de sueño',
      'prog.windowLine': 'Acuéstate <b>no antes de las {bed}</b> y levántate a las <b>{rise}</b>, todos los días.',
      'prog.windowLen': 'Tiempo en cama: {d}', 'prog.seeWeek': 'Ver la semana {w}', 'prog.reviewDue': 'Revisión semanal lista',
      'prog.reviewIn': 'Próxima revisión: {d}', 'prog.drowsy': 'Las primeras semanas puedes tener más sueño de día. Si tienes sueño, no manejes ni operes maquinaria. Si te pasa manejando, deja el programa y vuelve a tu horario anterior.',
      'prog.done.title': 'Programa completado', 'prog.done.text': 'Terminaste las 6 semanas. Puedes seguir ajustando tu ventana cada semana o terminar.',
      'prog.summary': 'Ver mi resumen', 'prog.finish': 'Terminar programa', 'prog.finished': 'Programa terminado. Tu plan de recaídas sigue en la semana 6.',
      'prog.finishConfirm': '¿Terminar el programa? Tu diario se conserva.',
      'prog.cancelConfirm': '¿Salir del programa? Tu diario se conserva.',
      'prog.lowTib': 'Ya pasas menos de 6 horas en la cama: la ventana de sueño no aplica. La ruta suave es la indicada para ti.',
      'prog.useGentle': 'Usar la ruta suave',
      'start.title': 'Tu ventana de sueño', 'start.baseline': 'Tu semana de registro ({n} noches)',
      'start.safety': 'Antes de empezar, confirma que nada de esto te aplica:', 'start.safetyOk': 'Confirmo que ninguna me aplica',
      'start.safetyNo': 'Algo sí me aplica', 'start.rise': '¿A qué hora te vas a levantar todos los días?',
      'start.mode': '¿Cómo quieres empezar?',
      'mode.gentle': 'Suave (recomendada)', 'mode.gentle.text': 'Reduces tu tiempo en cama poco a poco. Mejora un poco más lento, pero es más fácil de seguir.',
      'mode.standard': 'Rápida', 'mode.standard.text': 'Ajustas tu tiempo en cama desde el primer día. Mejora más rápido, con más sueño de día al principio.',
      'start.preview': 'Esta semana: acuéstate no antes de las <b>{bed}</b> y levántate a las <b>{rise}</b> ({d} en cama).',
      'start.btn': 'Empezar el programa',
      'stat.sleep': 'Sueño', 'stat.inBed': 'En cama', 'stat.eff': 'Eficiencia', 'stat.sol': 'Para dormirte', 'stat.waso': 'Despierto de noche',
      'stat.rested': 'Descanso (1–5)', 'stat.nights': 'Noches',

      // weeks
      'w1.title': 'Tu ventana de sueño',
      'w1.text': 'Duermes dentro de tu ventana. Pasar menos tiempo despierto en la cama hace el sueño más profundo y continuo: es la parte con más efecto de la terapia para el insomnio.',
      'w1.rules': 'Las 4 reglas',
      'w1.r1': 'Menos tiempo en la cama: solo dentro de tu ventana.',
      'w1.r2': 'Misma hora de levantarte todos los días, también en fin de semana.',
      'w1.r3': 'A la cama solo cuando tengas sueño (párpados pesados, cabeceo), no solo cansancio.',
      'w1.r4': 'Si no duermes en unos 15 a 20 minutos, sal de la cama y regresa con sueño. No mires el reloj: estímalo.',
      'w1.action': 'Agrega tu hora de levantarte y tu hora de acostarte al calendario del teléfono.',
      'w1.calendar': 'Agregar al calendario',
      'w2.title': 'Prepara tu tarde',
      'w2.text': 'Lo que haces en la tarde empuja o frena el sueño. "Mi noche" calcula tus horarios con tu hora de acostarte.',
      'w2.action': 'Elige un solo cambio para esta semana: el último café a tiempo, luces bajas 3 horas antes o un baño tibio 1 a 2 horas antes.',
      'w2.btn': 'Abrir Mi noche',
      'w3.title': 'Cierra el día',
      'w3.text': 'Si la mente se activa en la cama, saca los pendientes antes. En un estudio pequeño, escribir 5 minutos la lista de mañana ayudó a dormirse más rápido.',
      'w3.action': 'Cada tarde-noche, 5 minutos: escribe lo que harás mañana, lo más concreto posible, y para cada preocupación el siguiente paso pequeño.',
      'w3.btn': 'Cierra el día',
      'w4.title': 'Deja de intentar dormir',
      'w4.text': 'El sueño no se fuerza: entre más lo intentas, más despierto estás. Soltar el esfuerzo y cambiar algunas creencias ayuda.',
      'w4.action': 'Esta semana, en la cama, deja de intentarlo: quédate cómodo, con los ojos abiertos en la oscuridad, y deja que el sueño llegue solo.',
      'w4.beliefs': 'Creencias que conviene revisar',
      'w4.b1': '"Si no duermo 8 horas, mañana será un desastre." → Una mala noche se nota, pero casi nunca arruina el día.',
      'w4.b2': '"Tengo que quedarme en la cama para recuperar sueño." → Más tiempo despierto en la cama debilita el sueño.',
      'w4.b3': '"Ya perdí mi capacidad de dormir." → El sueño se reentrena; para eso son las reglas.',
      'w4.b4': '"Debo dormirme en cuanto me acuesto." → Tardar 15 a 20 minutos es normal.',
      'w4.b5': '"Una siesta larga me ayuda a compensar." → Las siestas largas quitan sueño a la noche.',
      'w5.title': 'Mente tranquila',
      'w5.text': 'Cuando la mente no se apaga, dale algo neutro que hacer.',
      'w5.action': 'Elige una herramienta y úsala 3 noches: barajado mental, respiración lenta 10 a 20 minutos antes de dormir o música tranquila.',
      'w5.shuffle': 'Barajado mental', 'w5.shuffleEv': 'prometedor, poco probado', 'w5.breath': 'Respiración lenta', 'w5.breathEv': 'evidencia moderada',
      'w5.music': 'Música tranquila', 'w5.musicEv': 'evidencia moderada',
      'w6.title': 'Plan para recaídas',
      'w6.text': 'Las malas noches vuelven de vez en cuando; eso no es recaer. Lo que importa es cómo respondes.',
      'w6.1': 'Mantén tu hora de levantarte.', 'w6.2': 'No te quedes despierto en la cama: sal y regresa con sueño.',
      'w6.3': 'No compenses con siestas largas ni acostándote temprano.',
      'w6.4': 'Si pasan varias semanas mal, registra una semana y retoma tu ventana.',
      'w6.action': 'Revisa tu resumen y guárdalo.',
      'week.action': 'Acción de la semana', 'week.locked': 'Se abre en la semana {w}.',

      // review
      'rev.title': 'Revisión semanal', 'rev.nights': 'Noches registradas desde la última revisión: {n}',
      'rev.good': 'Noches con menos de 30 min para dormirte y menos de 30 min despierto: {c} de {n}.',
      'rev.needData': 'Registra al menos 4 noches para ajustar tu ventana. Por ahora se queda igual.',
      'rev.expand': 'Vas bien: tu sueño se está consolidando. Suma 15 minutos.',
      'rev.reduce': 'Todavía pasas tiempo despierto en la cama. Quita 15 minutos.',
      'rev.compress': 'Seguimos reduciendo poco a poco tu tiempo en cama.',
      'rev.hold': 'Mantén tu ventana esta semana.', 'rev.holdFloor': 'Ya estás en el mínimo de 6 horas: mantenla.',
      'rev.holdCap': 'Ya llegaste a 9 horas en cama: mantenla.',
      'rev.newWindow': 'Nueva ventana: acuéstate no antes de las <b>{bed}</b>, levántate a las <b>{rise}</b> ({d} en cama).',
      'rev.apply': 'Aplicar', 'rev.keep': 'Prefiero mantenerla igual', 'rev.ok': 'Entendido',

      // summary
      'sum.title': 'Tu resumen', 'sum.before': 'Al empezar', 'sum.after': 'Última semana',
      'sum.share': 'Guardar o compartir resumen', 'sum.none': 'Aún no hay datos suficientes para comparar.',

      // diary
      'diary.title': 'Registro de la noche', 'diary.cta': 'Registrar anoche (1 min)', 'diary.other': 'Registrar otra noche',
      'diary.last': 'Anoche', 'diary.lastLine': 'Dormiste {tst} · tardaste {sol} en dormirte · {w} despertares',
      'diary.nightOf': 'Noche del {from} al {to}', 'diary.today': 'Anoche', 'diary.yesterday': 'Antenoche', 'diary.before': 'Hace 3 noches',
      'diary.bed': 'Me acosté a dormir a las', 'diary.sol': 'Tardé en dormirme',
      'diary.wakes': 'Me desperté durante la noche', 'diary.waso': 'Tiempo despierto en total durante la noche',
      'diary.finalWake': 'Desperté por última vez a las', 'diary.outOfBed': 'Me levanté de la cama a las',
      'diary.nap': 'Siesta ayer', 'diary.rested': '¿Qué tan descansado te sientes?', 'diary.rested.low': 'Nada', 'diary.rested.high': 'Mucho',
      'diary.free': 'Hoy es día libre (sin alarma ni obligaciones)', 'diary.estimate': 'Estima, no hace falta exactitud.',
      'diary.times': '{n} veces', 'diary.none': 'Ninguna', 'diary.deleteConfirm': '¿Borrar el registro de esta noche?',
      'err.missing': 'Completa las tres horas.', 'err.outOfBedBeforeWake': 'La hora de levantarte no puede ser antes de tu último despertar.',
      'err.nightLength': 'Revisa las horas: la noche debe durar entre 1 y 16 horas.', 'err.awakeTooLong': 'El tiempo despierto es mayor que la noche. Revisa los datos.',
      'diary.history': 'Ver mis noches', 'diary.historyTitle': 'Mis noches', 'diary.empty': 'Aún no hay noches registradas.',

      // stats
      'stats.title': 'Tu última semana', 'stats.empty': 'Registra algunas noches para ver tus promedios y tu regularidad.',
      'stats.regularity': 'Regularidad', 'stats.sri': 'Índice de regularidad: {v} de 100',
      'stats.sriHelp': '100 = te duermes y despiertas a la misma hora todos los días. Dormir a horas regulares se asocia con menor mortalidad, más que dormir más horas.',
      'stats.sriNeed': 'Con 6 noches seguidas registradas calculamos tu índice de regularidad.',
      'stats.onsetSD': 'Tu hora de dormirte varía ±{d}.', 'stats.sj': 'Jet lag social: {d} (tu sueño se mueve más tarde en días libres).',
      'stats.sjEarlier': 'Jet lag social: {d}.', 'stats.chart': 'Tus últimas 14 noches', 'stats.chartLegend': 'Barra clara: en cama · barra fuerte: dormido',
      'stats.noScore': 'No damos una calificación por noche: ver un "mal puntaje" puede hacerte sentir peor al día siguiente.',

      // my night
      'night.title': 'Mi noche', 'night.subtitle': 'Tus horarios de hoy, calculados con tu hora de despertar.',
      'night.fromProgram': 'Calculado con tu ventana del programa.', 'night.adjust': 'Ajustar', 'night.calendar': 'Agregar al calendario',
      'night.calendarHelp': 'Descarga un archivo que tu calendario convierte en recordatorios diarios.',
      'it.wake': 'Despierta', 'it.light': 'Sal a la luz del día', 'it.caffeine': 'Último café', 'it.caffeineNone': 'Hoy mejor sin cafeína o descafeinado',
      'it.exercise': 'Termina el ejercicio intenso', 'it.dinner': 'Cena (ligera, evidencia débil)', 'it.dim': 'Baja las luces y las pantallas',
      'it.bath': 'Baño o regadera tibia', 'it.bed': 'Hora de acostarte', 'it.alcohol': 'Si tomas alcohol: poco y temprano.',
      'it.caffeineNote': 'Estimación: {h} h antes de dormir.',
      'nightf.title': 'Ajustar Mi noche', 'nightf.wake': 'Me despierto a las', 'nightf.need': 'Horas de sueño que buscas',
      'nightf.needHelp': 'Adultos: 7 a 9 h. Con 65 o más: 7 a 8 h.', 'nightf.latency': 'Suelo tardar en dormirme',
      'nightf.caffeine': 'Café al día', 'caf.none': 'No tomo', 'caf.one': '1 taza (~100 mg)', 'caf.two': '2 o más / bebida energética',
      'nightf.factors': 'Esto cambia cuánto dura la cafeína en tu cuerpo:', 'nightf.smoker': 'Fumo', 'nightf.contraceptive': 'Tomo anticonceptivos hormonales',
      'nightf.pregnant': 'Estoy embarazada',
      'cal.wake': 'Levántate', 'cal.caffeine': 'Último café del día', 'cal.dim': 'Baja las luces', 'cal.bath': 'Baño tibio', 'cal.bed': 'Hora de acostarte',
      'cal.desc': 'Recordatorio de SLEEP_LAB',

      // tools
      'tools.title': 'Para la noche', 'tools.cant': 'No puedo dormir', 'tools.cantText': 'Una guía paso a paso, con la pantalla oscura.',
      'tools.close': 'Cierra el día', 'tools.shuffle': 'Barajado mental', 'tools.breath': 'Respiración 6/min',

      // can't sleep
      'cs.title': 'No puedo dormir',
      'cs.s1': 'No mires el reloj. Si sientes que llevas unos 15 a 20 minutos despierto y sin sueño, sigue al siguiente paso.',
      'cs.s1b': 'Si apenas te acostaste: quédate cómodo, deja de intentarlo y deja que el sueño llegue solo.',
      'cs.s2': 'Sal de la cama y ve a un lugar con luz tenue. Si está oscuro, siéntate primero y no camines a oscuras.',
      'cs.s3': 'Haz algo tranquilo y aburrido hasta que te dé sueño: leer algo ligero en papel, escuchar algo tranquilo, respirar lento.',
      'cs.s4': '¿Ya tienes sueño (párpados pesados, cabeceo)? Regresa a la cama. Si vuelves a estar despierto un rato, repite. Mañana levántate a tu hora de siempre.',
      'cs.notYet': 'Acabo de acostarme', 'cs.done': 'Regresar a la cama', 'cs.sound': 'Sonido tranquilo (45 min)',

      // pacer and shuffle
      'pacer.title': 'Respiración lenta', 'pacer.in': 'Inhala', 'pacer.out': 'Exhala', 'pacer.stop': 'Detener', 'pacer.help': '6 respiraciones por minuto: inhala 4 s, exhala 6 s.',
      'sh.title': 'Barajado mental', 'sh.help': 'Imagina cada palabra con calma: su forma, su color. No hay que hacer nada más. Se detiene solo en 15 minutos.',
      'sh.voice': 'Leer en voz baja', 'sh.stop': 'Detener', 'sh.ev': 'Prometedor, poco probado: imaginar escenas neutras ayudó a dormirse en un estudio pequeño.',

      // close the day
      'cd.title': 'Cierra el día', 'cd.help': 'Cinco minutos, mejor en la tarde-noche que en la cama.',
      'cd.todos': 'Lo que harás mañana (lo más concreto posible)', 'cd.worries': 'Lo que te preocupa → el siguiente paso pequeño',
      'cd.done': 'Listo, lo suelto por hoy', 'cd.yours': 'Tu lista de anoche',

      // data
      'data.title': 'Mis datos', 'data.text': 'Tus datos viven solo en este teléfono. Haz un respaldo de vez en cuando.',
      'data.install': 'Consejo: instala la app en tu pantalla de inicio para que el navegador no borre tus datos.',
      'data.backup': 'Respaldo completo', 'data.csv': 'Diario en hoja de cálculo', 'data.import': 'Restaurar respaldo', 'data.delete': 'Borrar todo',
      'data.importConfirm': 'Esto reemplaza tus datos actuales con los del archivo ({n} noches). ¿Continuar?',
      'data.importBad': 'Ese archivo no es un respaldo de SLEEP_LAB.', 'data.imported': 'Respaldo restaurado',
      'data.deleteConfirm': '¿Borrar todos tus datos de Mi sueño en este teléfono? No se puede deshacer.', 'data.deleted': 'Datos borrados',

      // evidence list
      'ev.cbti': 'Qué partes de la terapia para el insomnio funcionan (241 ensayos)', 'ev.bbti': 'Tratamiento breve en adultos mayores',
      'ev.manual': 'Manual del tratamiento breve (reglas de la ventana)', 'ev.compress': 'Reducción gradual frente a restricción',
      'ev.sleepy': 'Somnolencia en las primeras semanas', 'ev.digital': 'Programa 100 % automatizado (1,721 personas)',
      'ev.regularity': 'Regularidad y mortalidad', 'ev.sri': 'Índice de regularidad del sueño', 'ev.caffeine': 'Cafeína y hora límite',
      'ev.light': 'Luz recomendada de día y de noche', 'ev.bath': 'Baño tibio antes de dormir', 'ev.exercise': 'Ejercicio en la tarde',
      'ev.duration': 'Horas de sueño recomendadas', 'ev.todo': 'Lista de pendientes antes de dormir', 'ev.stimulus': 'Control de estímulos',
      'ev.paradox': 'Dejar de intentar dormir', 'ev.imagery': 'Distracción con imágenes', 'ev.acute': 'Insomnio reciente: una sesión',
      'ev.feedback': 'Por qué no hay calificación por noche', 'ev.diary': 'Diario de sueño estándar'
    },
    en: {
      'title': 'My Sleep',
      'subtitle': 'Your diary, your evening plan and your program. Everything stays on this phone, no account needed.',
      'disclaimer': 'Educational self-help tool. Not a substitute for medical care.',
      'close': 'Close', 'back': 'Back', 'next': 'Next', 'save': 'Save', 'cancel': 'Cancel', 'edit': 'Edit', 'delete': 'Delete', 'open': 'Open',
      'saved': 'Saved', 'err.save': 'Could not save in this browser. Make sure you are not in private mode.',
      'minutes': '{n} min', 'hours': '{h} h', 'hm': '{h} h {m} min',
      'evidence': 'What this is based on',

      'home.badge': 'New', 'home.title': 'My Sleep: a plan made for you',
      'home.start': 'Answer 2 minutes of questions and we tell you where to start: optimize, reset your sleep or a gentle route.',
      'home.startBtn': 'Start the check', 'home.log': 'How did you sleep last night? Log it in one minute.', 'home.logBtn': 'Log my night',
      'home.program': 'Week {w} of 6 · Tonight: not in bed before {bed}, up at {rise}',
      'home.baseline': 'Logging week: {n} of 7 nights so far.', 'home.openBtn': 'Open My Sleep',
      'home.night': 'Tonight: bed at {bed}{cafe}', 'home.cafe': ' · last coffee: {t}',

      'check.cta.title': 'Start here', 'check.cta.text': 'A 2-minute check picks your route. It is not a diagnosis: it only decides which tools help you most.',
      'check.cta.btn': 'Take the check (2 min)', 'check.redo': 'Retake the check', 'check.title': 'Sleep check',
      'check.q.main': 'What best describes your nights?',
      'check.main.good': 'I sleep well and want to sleep better', 'check.main.onset': 'It takes me a long time to fall asleep',
      'check.main.maintenance': 'I wake up during the night or too early', 'check.main.unrefreshed': 'I sleep, but wake up tired',
      'check.q.nights': 'How many nights a week does it happen?', 'check.nights.few': '1 or 2 nights', 'check.nights.most': '3 or more nights',
      'check.q.duration': 'How long has it been happening?', 'check.duration.lt3m': 'Less than 3 months', 'check.duration.gt3m': '3 months or more',
      'check.q.senior': 'Are you 65 or older?', 'yes': 'Yes', 'no': 'No',
      'check.q.flags': 'Tick anything that applies', 'check.flags.help': 'You can leave everything unticked. It keeps the plan safe for you.',
      'flag.snore': 'You snore loudly or someone has seen you stop breathing in your sleep',
      'flag.drowsy': 'You have fallen asleep while driving or at a dangerous moment',
      'flag.riskyJob': 'You drive for work or do risky work (machinery, heights)',
      'flag.shift': 'You work nights or rotating shifts',
      'flag.pregnant': 'You are pregnant',
      'flag.seizure': 'You have epilepsy or seizures',
      'flag.mood': 'Bipolar disorder, psychosis or thoughts of harming yourself',
      'flag.parasomnia': 'Sleepwalking or other unusual behaviour while asleep',
      'flag.falls': 'You have fallen in the last year or find it hard to walk safely at night',
      'flag.shortTIB': 'You already spend less than 6 hours in bed',
      'flag.rls': 'Discomfort in your legs when still at night, relieved by moving them',
      'check.seeResult': 'See my route',
      'route.optimize': 'Optimize route', 'route.reset': 'Reset route', 'route.gentle': 'Gentle route',
      'route.optimize.text': 'You already sleep reasonably well. What pays off most now is regularity, light and a well-planned evening.',
      'route.reset.text': 'The 6-week program suits you: it is the best-supported approach to fall asleep sooner and wake up less.',
      'route.reset.acute': 'Since it started less than 3 months ago, begin with a short plan. It is often enough.',
      'route.gentle.text': 'Improve without cutting your time in bed: a fixed schedule, tools for the mind and your evening plan.',
      'route.gentle.why': 'Because of something you ticked, this route does not use the sleep window: cutting time in bed causes more daytime sleepiness in the first weeks.',
      'route.steps': 'What helps you most:',
      'route.optimize.1': 'Get up at the same time every day (±30 min), weekends included.',
      'route.optimize.2': 'Aim for 7 to 9 hours of sleep (7 to 8 if you are 65 or older).',
      'route.optimize.3': 'Get daylight in your first hour and dim the lights 3 hours before bed.',
      'route.optimize.4': 'Log your nights for a couple of weeks to see your regularity.',
      'route.gentle.1': 'Get up at the same time every day.',
      'route.gentle.2': 'Go to bed when you are sleepy, not just tired.',
      'route.gentle.3': 'If you cannot sleep, sit up with dim light and return to bed when sleepy. Do not walk in the dark.',
      'route.gentle.4': 'Use "Close the day" and "Quiet mind" when your head will not switch off.',
      'note.apnea': 'Loud snoring with breathing pauses is a typical sign of sleep apnea, which this app cannot assess.',
      'note.drowsy': 'Falling asleep while driving is dangerous: if you are sleepy, do not drive.',
      'note.rls': 'Leg discomfort that gets worse at rest and at night, and eases when you move, is typical of restless legs syndrome, which this app cannot assess.',
      'note.crisis': 'If you have thoughts of harming yourself, get help today: in the US, call or text 988; in Mexico, Línea de la Vida 800 911 2000 (free, 24 h); in an emergency, 911.',

      'acute.title': 'Short plan for recent insomnia',
      'acute.1': 'Keep your wake-up time fixed, even after a bad night.',
      'acute.2': 'Do not make up for it by staying longer in bed or going to bed earlier.',
      'acute.3': 'If you are not asleep within about 20 minutes, get up and go back when sleepy.',
      'acute.4': 'Avoid naps longer than 30 minutes.',
      'acute.5': 'Log your nights. If nothing changes in 3 or 4 weeks, start the 6-week program.',
      'acute.ev': 'A single session with these rules reached 60% remission versus 15% at one month, in a small study (40 people).',
      'acute.startProgram': 'Start the 6-week program',

      'prog.title': 'Reset program · 6 weeks',
      'prog.intro': 'First you log 7 nights just as you sleep today. With that we calculate your sleep window and adjust it every week with your data.',
      'prog.startBaseline': 'Start: log 7 nights',
      'prog.baseline.title': 'Logging week', 'prog.baseline.text': 'Log every morning. Do not change anything yet.',
      'prog.baseline.count': 'Nights logged in the last 7 days: {n} of 7 (minimum 5).',
      'prog.baseline.ready': 'Calculate my window', 'prog.cancel': 'Leave the program',
      'prog.week': 'Week {w} of 6', 'prog.window': 'Your sleep window',
      'prog.windowLine': 'Go to bed <b>no earlier than {bed}</b> and get up at <b>{rise}</b>, every day.',
      'prog.windowLen': 'Time in bed: {d}', 'prog.seeWeek': 'See week {w}', 'prog.reviewDue': 'Weekly review ready',
      'prog.reviewIn': 'Next review: {d}', 'prog.drowsy': 'In the first weeks you may be sleepier during the day. If you are sleepy, do not drive or operate machinery. If it happens while driving, stop the program and go back to your old schedule.',
      'prog.done.title': 'Program completed', 'prog.done.text': 'You finished the 6 weeks. You can keep adjusting your window every week or finish.',
      'prog.summary': 'See my summary', 'prog.finish': 'Finish program', 'prog.finished': 'Program finished. Your relapse plan stays in week 6.',
      'prog.finishConfirm': 'Finish the program? Your diary is kept.',
      'prog.cancelConfirm': 'Leave the program? Your diary is kept.',
      'prog.lowTib': 'You already spend less than 6 hours in bed: the sleep window does not apply. The gentle route is the right one for you.',
      'prog.useGentle': 'Use the gentle route',
      'start.title': 'Your sleep window', 'start.baseline': 'Your logging week ({n} nights)',
      'start.safety': 'Before you start, confirm none of this applies to you:', 'start.safetyOk': 'I confirm none applies',
      'start.safetyNo': 'Something does apply', 'start.rise': 'What time will you get up every day?',
      'start.mode': 'How do you want to start?',
      'mode.gentle': 'Gentle (recommended)', 'mode.gentle.text': 'You cut your time in bed little by little. A bit slower, but easier to stick with.',
      'mode.standard': 'Fast', 'mode.standard.text': 'You set your time in bed from day one. Faster, with more daytime sleepiness at first.',
      'start.preview': 'This week: not in bed before <b>{bed}</b>, up at <b>{rise}</b> ({d} in bed).',
      'start.btn': 'Start the program',
      'stat.sleep': 'Sleep', 'stat.inBed': 'In bed', 'stat.eff': 'Efficiency', 'stat.sol': 'To fall asleep', 'stat.waso': 'Awake at night',
      'stat.rested': 'Rested (1–5)', 'stat.nights': 'Nights',

      'w1.title': 'Your sleep window',
      'w1.text': 'You sleep inside your window. Spending less time awake in bed makes sleep deeper and more continuous: it is the most effective part of insomnia therapy.',
      'w1.rules': 'The 4 rules',
      'w1.r1': 'Less time in bed: only inside your window.',
      'w1.r2': 'Same wake-up time every day, weekends included.',
      'w1.r3': 'Go to bed only when sleepy (heavy eyelids, nodding off), not just tired.',
      'w1.r4': 'If you are not asleep in about 15 to 20 minutes, get out of bed and come back when sleepy. Do not check the clock: estimate.',
      'w1.action': 'Add your wake-up time and bedtime to your phone calendar.',
      'w1.calendar': 'Add to calendar',
      'w2.title': 'Prepare your evening',
      'w2.text': 'What you do in the evening pushes sleep forward or holds it back. "My night" works out your times from your bedtime.',
      'w2.action': 'Pick one change for this week: last coffee on time, dim lights 3 hours before bed, or a warm bath 1 to 2 hours before.',
      'w2.btn': 'Open My night',
      'w3.title': 'Close the day',
      'w3.text': 'If your mind gets busy in bed, get your to-dos out first. In a small study, writing tomorrow\'s list for 5 minutes helped people fall asleep faster.',
      'w3.action': 'Every evening, 5 minutes: write what you will do tomorrow, as specifically as you can, and for each worry the next small step.',
      'w3.btn': 'Close the day',
      'w4.title': 'Stop trying to sleep',
      'w4.text': 'Sleep cannot be forced: the harder you try, the more awake you are. Letting go of the effort and changing some beliefs helps.',
      'w4.action': 'This week, in bed, stop trying: get comfortable, keep your eyes open in the dark, and let sleep come on its own.',
      'w4.beliefs': 'Beliefs worth checking',
      'w4.b1': '"If I do not sleep 8 hours, tomorrow will be a disaster." → A bad night shows, but it rarely ruins the day.',
      'w4.b2': '"I must stay in bed to catch up." → More time awake in bed weakens sleep.',
      'w4.b3': '"I have lost my ability to sleep." → Sleep can be retrained; that is what the rules are for.',
      'w4.b4': '"I should fall asleep as soon as I lie down." → Taking 15 to 20 minutes is normal.',
      'w4.b5': '"A long nap helps me make up for it." → Long naps take sleep away from the night.',
      'w5.title': 'Quiet mind',
      'w5.text': 'When your mind will not switch off, give it something neutral to do.',
      'w5.action': 'Pick one tool and use it 3 nights: cognitive shuffle, slow breathing 10 to 20 minutes before bed, or calm music.',
      'w5.shuffle': 'Cognitive shuffle', 'w5.shuffleEv': 'promising, little tested', 'w5.breath': 'Slow breathing', 'w5.breathEv': 'moderate evidence',
      'w5.music': 'Calm music', 'w5.musicEv': 'moderate evidence',
      'w6.title': 'Relapse plan',
      'w6.text': 'Bad nights come back now and then; that is not a relapse. What matters is how you respond.',
      'w6.1': 'Keep your wake-up time.', 'w6.2': 'Do not lie awake in bed: get up and come back when sleepy.',
      'w6.3': 'Do not make up for it with long naps or early bedtimes.',
      'w6.4': 'If several weeks go badly, log for a week and return to your window.',
      'w6.action': 'Look at your summary and save it.',
      'week.action': 'This week\'s action', 'week.locked': 'Opens in week {w}.',

      'rev.title': 'Weekly review', 'rev.nights': 'Nights logged since the last review: {n}',
      'rev.good': 'Nights with under 30 min to fall asleep and under 30 min awake: {c} of {n}.',
      'rev.needData': 'Log at least 4 nights to adjust your window. For now it stays the same.',
      'rev.expand': 'Going well: your sleep is consolidating. Add 15 minutes.',
      'rev.reduce': 'You still spend time awake in bed. Take off 15 minutes.',
      'rev.compress': 'We keep reducing your time in bed little by little.',
      'rev.hold': 'Keep your window this week.', 'rev.holdFloor': 'You are at the 6-hour minimum: keep it.',
      'rev.holdCap': 'You reached 9 hours in bed: keep it.',
      'rev.newWindow': 'New window: not in bed before <b>{bed}</b>, up at <b>{rise}</b> ({d} in bed).',
      'rev.apply': 'Apply', 'rev.keep': 'I prefer to keep it the same', 'rev.ok': 'Got it',

      'sum.title': 'Your summary', 'sum.before': 'At the start', 'sum.after': 'Last week',
      'sum.share': 'Save or share summary', 'sum.none': 'Not enough data to compare yet.',

      'diary.title': 'Night log', 'diary.cta': 'Log last night (1 min)', 'diary.other': 'Log another night',
      'diary.last': 'Last night', 'diary.lastLine': 'You slept {tst} · took {sol} to fall asleep · {w} awakenings',
      'diary.nightOf': 'Night of {from} to {to}', 'diary.today': 'Last night', 'diary.yesterday': 'Night before', 'diary.before': '3 nights ago',
      'diary.bed': 'I went to bed to sleep at', 'diary.sol': 'It took me to fall asleep',
      'diary.wakes': 'I woke up during the night', 'diary.waso': 'Total time awake during the night',
      'diary.finalWake': 'My final awakening was at', 'diary.outOfBed': 'I got out of bed at',
      'diary.nap': 'Nap yesterday', 'diary.rested': 'How rested do you feel?', 'diary.rested.low': 'Not at all', 'diary.rested.high': 'Very',
      'diary.free': 'Today is a free day (no alarm or commitments)', 'diary.estimate': 'Estimate; it does not need to be exact.',
      'diary.times': '{n} times', 'diary.none': 'None', 'diary.deleteConfirm': 'Delete this night\'s entry?',
      'err.missing': 'Fill in the three times.', 'err.outOfBedBeforeWake': 'Getting out of bed cannot be before your final awakening.',
      'err.nightLength': 'Check the times: the night must last between 1 and 16 hours.', 'err.awakeTooLong': 'Time awake is longer than the night. Check the numbers.',
      'diary.history': 'See my nights', 'diary.historyTitle': 'My nights', 'diary.empty': 'No nights logged yet.',

      'stats.title': 'Your last week', 'stats.empty': 'Log a few nights to see your averages and your regularity.',
      'stats.regularity': 'Regularity', 'stats.sri': 'Regularity index: {v} out of 100',
      'stats.sriHelp': '100 = you fall asleep and wake up at the same time every day. Regular sleep timing is linked to lower mortality, more than sleeping longer.',
      'stats.sriNeed': 'With 6 nights in a row logged we calculate your regularity index.',
      'stats.onsetSD': 'Your sleep onset time varies by ±{d}.', 'stats.sj': 'Social jet lag: {d} (your sleep shifts later on free days).',
      'stats.sjEarlier': 'Social jet lag: {d}.', 'stats.chart': 'Your last 14 nights', 'stats.chartLegend': 'Light bar: in bed · strong bar: asleep',
      'stats.noScore': 'We do not give a nightly score: seeing a "bad score" can make you feel worse the next day.',

      'night.title': 'My night', 'night.subtitle': 'Today\'s times, worked out from your wake-up time.',
      'night.fromProgram': 'Based on your program window.', 'night.adjust': 'Adjust', 'night.calendar': 'Add to calendar',
      'night.calendarHelp': 'Downloads a file your calendar turns into daily reminders.',
      'it.wake': 'Wake up', 'it.light': 'Get daylight', 'it.caffeine': 'Last coffee', 'it.caffeineNone': 'Better caffeine-free or decaf today',
      'it.exercise': 'Finish hard exercise', 'it.dinner': 'Dinner (light, weak evidence)', 'it.dim': 'Dim lights and screens',
      'it.bath': 'Warm bath or shower', 'it.bed': 'Bedtime', 'it.alcohol': 'If you drink alcohol: a little, and early.',
      'it.caffeineNote': 'Estimate: {h} h before bed.',
      'nightf.title': 'Adjust My night', 'nightf.wake': 'I wake up at', 'nightf.need': 'Hours of sleep you aim for',
      'nightf.needHelp': 'Adults: 7 to 9 h. 65 or older: 7 to 8 h.', 'nightf.latency': 'I usually take to fall asleep',
      'nightf.caffeine': 'Coffee per day', 'caf.none': 'None', 'caf.one': '1 cup (~100 mg)', 'caf.two': '2 or more / energy drink',
      'nightf.factors': 'These change how long caffeine stays in your body:', 'nightf.smoker': 'I smoke', 'nightf.contraceptive': 'I take hormonal contraceptives',
      'nightf.pregnant': 'I am pregnant',
      'cal.wake': 'Get up', 'cal.caffeine': 'Last coffee of the day', 'cal.dim': 'Dim the lights', 'cal.bath': 'Warm bath', 'cal.bed': 'Bedtime',
      'cal.desc': 'SLEEP_LAB reminder',

      'tools.title': 'For the night', 'tools.cant': 'I can\'t sleep', 'tools.cantText': 'A step-by-step guide with a dark screen.',
      'tools.close': 'Close the day', 'tools.shuffle': 'Cognitive shuffle', 'tools.breath': 'Breathing 6/min',

      'cs.title': 'I can\'t sleep',
      'cs.s1': 'Do not check the clock. If you feel you have been awake and not sleepy for about 15 to 20 minutes, go to the next step.',
      'cs.s1b': 'If you just went to bed: get comfortable, stop trying and let sleep come on its own.',
      'cs.s2': 'Get out of bed and go somewhere with dim light. If it is dark, sit up first and do not walk in the dark.',
      'cs.s3': 'Do something calm and boring until you feel sleepy: read something light on paper, listen to something calm, breathe slowly.',
      'cs.s4': 'Sleepy now (heavy eyelids, nodding off)? Go back to bed. If you are awake for a while again, repeat. Tomorrow, get up at your usual time.',
      'cs.notYet': 'I just went to bed', 'cs.done': 'Back to bed', 'cs.sound': 'Calm sound (45 min)',

      'pacer.title': 'Slow breathing', 'pacer.in': 'Breathe in', 'pacer.out': 'Breathe out', 'pacer.stop': 'Stop', 'pacer.help': '6 breaths per minute: in for 4 s, out for 6 s.',
      'sh.title': 'Cognitive shuffle', 'sh.help': 'Picture each word calmly: its shape, its colour. Nothing else to do. It stops by itself after 15 minutes.',
      'sh.voice': 'Read aloud softly', 'sh.stop': 'Stop', 'sh.ev': 'Promising, little tested: picturing neutral scenes helped people fall asleep in a small study.',

      'cd.title': 'Close the day', 'cd.help': 'Five minutes, better in the evening than in bed.',
      'cd.todos': 'What you will do tomorrow (as specific as you can)', 'cd.worries': 'What worries you → the next small step',
      'cd.done': 'Done, I let it go for today', 'cd.yours': 'Your list from last night',

      'data.title': 'My data', 'data.text': 'Your data lives only on this phone. Make a backup now and then.',
      'data.install': 'Tip: install the app on your home screen so the browser does not delete your data.',
      'data.backup': 'Full backup', 'data.csv': 'Diary as spreadsheet', 'data.import': 'Restore backup', 'data.delete': 'Delete everything',
      'data.importConfirm': 'This replaces your current data with the file\'s ({n} nights). Continue?',
      'data.importBad': 'That file is not a SLEEP_LAB backup.', 'data.imported': 'Backup restored',
      'data.deleteConfirm': 'Delete all your My Sleep data on this phone? This cannot be undone.', 'data.deleted': 'Data deleted',

      'ev.cbti': 'Which parts of insomnia therapy work (241 trials)', 'ev.bbti': 'Brief treatment in older adults',
      'ev.manual': 'Brief treatment manual (window rules)', 'ev.compress': 'Gradual reduction versus restriction',
      'ev.sleepy': 'Sleepiness in the first weeks', 'ev.digital': 'Fully automated program (1,721 people)',
      'ev.regularity': 'Regularity and mortality', 'ev.sri': 'Sleep Regularity Index', 'ev.caffeine': 'Caffeine and cutoff time',
      'ev.light': 'Recommended light by day and night', 'ev.bath': 'Warm bath before bed', 'ev.exercise': 'Evening exercise',
      'ev.duration': 'Recommended hours of sleep', 'ev.todo': 'To-do list before bed', 'ev.stimulus': 'Stimulus control',
      'ev.paradox': 'Stop trying to sleep', 'ev.imagery': 'Imagery distraction', 'ev.acute': 'Recent insomnia: one session',
      'ev.feedback': 'Why there is no nightly score', 'ev.diary': 'Standard sleep diary'
    }
  };

  var WORDS = {
    es: ['manzana', 'nube', 'bicicleta', 'lápiz', 'tortuga', 'montaña', 'cuchara', 'ventana', 'árbol', 'barco', 'guitarra', 'pluma',
      'naranja', 'puente', 'sombrero', 'río', 'faro', 'mariposa', 'tetera', 'bosque', 'caracol', 'llave', 'globo', 'canasta', 'piedra',
      'paraguas', 'conejo', 'molino', 'vela', 'jardín', 'campana', 'pez', 'hoja', 'taza', 'tren', 'estrella', 'playa', 'zapato', 'camello',
      'isla', 'girasol', 'libro', 'columpio', 'abeja', 'cometa', 'castillo', 'ballena', 'uva', 'escalera', 'violín', 'trigo', 'muñeca',
      'tambor', 'pino', 'fresa', 'koala', 'velero', 'limón', 'cereza', 'lago', 'colina', 'búho', 'pingüino', 'mango', 'tomate', 'ancla',
      'brújula', 'mapa', 'cesta', 'peine', 'botón', 'cuaderno', 'sandía', 'cebra', 'flamenco', 'nogal', 'semilla', 'tulipán', 'cactus',
      'concha', 'arena', 'granero', 'oveja', 'pato', 'rana', 'jirafa', 'plátano', 'durazno', 'zanahoria', 'calabaza', 'pan', 'queso',
      'canoa', 'lancha', 'carreta', 'linterna', 'alfombra', 'cojín', 'sillón', 'mesa', 'florero', 'helecho', 'roble', 'cascada', 'pradera'],
    en: ['apple', 'cloud', 'bicycle', 'pencil', 'turtle', 'mountain', 'spoon', 'window', 'tree', 'boat', 'guitar', 'feather', 'orange',
      'bridge', 'hat', 'river', 'lighthouse', 'butterfly', 'teapot', 'forest', 'snail', 'key', 'balloon', 'basket', 'stone', 'umbrella',
      'rabbit', 'windmill', 'candle', 'garden', 'bell', 'fish', 'leaf', 'cup', 'train', 'star', 'beach', 'shoe', 'camel', 'island',
      'sunflower', 'book', 'swing', 'bee', 'kite', 'castle', 'whale', 'grape', 'ladder', 'violin', 'wheat', 'drum', 'pine', 'strawberry',
      'koala', 'sailboat', 'lemon', 'cherry', 'lake', 'hill', 'owl', 'penguin', 'mango', 'tomato', 'anchor', 'compass', 'map', 'comb',
      'button', 'notebook', 'watermelon', 'zebra', 'flamingo', 'walnut', 'seed', 'tulip', 'cactus', 'seashell', 'sand', 'barn', 'sheep',
      'duck', 'frog', 'giraffe', 'banana', 'peach', 'carrot', 'pumpkin', 'bread', 'cheese', 'canoe', 'wagon', 'lantern', 'rug', 'cushion',
      'armchair', 'table', 'vase', 'fern', 'oak', 'waterfall', 'meadow', 'pebble', 'acorn']
  };

  var EVIDENCE = [
    ['ev.cbti', 'Furukawa 2024', 38231522], ['ev.bbti', 'Buysse 2011', 21263078], ['ev.manual', 'Troxel 2012', 22946736],
    ['ev.compress', 'Jernelöv 2025', 40205789], ['ev.sleepy', 'Kyle 2014', 24497651], ['ev.digital', 'Vedaa 2020', 33328044],
    ['ev.acute', 'Ellis 2015', 25515106], ['ev.diary', 'Carney 2012', 22294820], ['ev.feedback', 'Gavriloff 2018', 29989248],
    ['ev.regularity', 'Windred 2024', 37738616], ['ev.sri', 'Phillips 2017', 28607474], ['ev.duration', 'Hirshkowitz 2015', 29073412],
    ['ev.caffeine', 'Gardiner 2023', 36870101], ['ev.light', 'Brown 2022', 35298459], ['ev.bath', 'Haghayegh 2019', 31102877],
    ['ev.exercise', 'Leota 2025', 40234380], ['ev.stimulus', 'Jansson-Fröjmark 2024', 37496454], ['ev.paradox', 'Jansson-Fröjmark 2022', 34405469],
    ['ev.todo', 'Scullin 2018', 29058942], ['ev.imagery', 'Harvey 2002', 11863237]
  ];

  // =====================================================================
  // Helpers
  // =====================================================================
  function lang() { return document.documentElement.lang === 'es' ? 'es' : 'en'; }
  function locale() { return lang() === 'es' ? 'es-MX' : 'en-US'; }
  function T(key, vars) {
    var s = STR[lang()][key];
    if (s == null) s = STR.en[key];
    if (s == null) return key;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    return s;
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function todayKey() { return C.dateKey(new Date()); }
  function keyDate(key) { var p = key.split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function fmtDay(key, opts) { return keyDate(key).toLocaleDateString(locale(), opts); }
  function fmtClock(hm) {
    var m = C.parseHM(hm);
    if (m === null) return '--';
    return new Date(2000, 0, 1, Math.floor(m / 60), m % 60).toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' });
  }
  function fmtDur(min) {
    min = Math.max(0, Math.round(min));
    var h = Math.floor(min / 60), m = min % 60;
    if (!h) return T('minutes', { n: m });
    if (!m) return T('hours', { h: h });
    return T('hm', { h: h, m: m });
  }
  function pct(x) { return x == null ? '--' : Math.round(x * 100) + ' %'; }
  function nightLabel(key) {
    return T('diary.nightOf', {
      from: fmtDay(C.addDays(key, -1), { weekday: 'long', day: 'numeric' }),
      to: fmtDay(key, { weekday: 'long', day: 'numeric', month: 'short' })
    });
  }
  function pubmed(id, label) {
    return '<a href="https://pubmed.ncbi.nlm.nih.gov/' + id + '/" target="_blank" rel="noopener">' + esc(label) + '</a>';
  }
  function btn(action, label, cls, arg) {
    return '<button type="button" class="sl-btn ' + (cls || '') + '" data-sl="' + action + '"' +
      (arg != null ? ' data-arg="' + esc(arg) + '"' : '') + '>' + label + '</button>';
  }
  function icon(name) { return '<i class="fa-solid fa-' + name + '" aria-hidden="true"></i>'; }

  // =====================================================================
  // Storage
  // =====================================================================
  function load() {
    try { return C.sanitizeData(JSON.parse(localStorage.getItem(STORE_KEY))); }
    catch (e) { return C.emptyData(); }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); return true; }
    catch (e) {
      if (!ui.saveWarned) { ui.saveWarned = true; toast(T('err.save')); }
      return false;
    }
  }
  function askPersist() {
    if (data.meta.persistAsked) return;
    data.meta.persistAsked = true;
    save();
    try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* optional */ }
  }

  // =====================================================================
  // Derived state
  // =====================================================================
  function checkResult() { return data.check ? C.routeCheck(data.check.answers) : null; }
  function recent(days) { var t = todayKey(); return C.entriesInRange(data.diary, C.addDays(t, -(days - 1)), t); }
  function programWindow() {
    var p = data.program;
    if (!p || p.phase !== 'active') return null;
    return { bed: C.bedtimeFor(p.rise, p.window), rise: p.rise, window: p.window };
  }
  function currentWeek() { var p = data.program; return p && p.start ? C.programWeek(p.start, todayKey()) : 0; }
  function reviewItems() {
    var p = data.program;
    return C.entriesInRange(data.diary, C.addDays(p.lastReview, 1), todayKey()).slice(-7);
  }
  function reviewDue() { var p = data.program; return p && p.phase === 'active' && C.daysBetween(p.lastReview, todayKey()) >= 7; }
  function nightPlan() {
    var n = data.night, w = programWindow();
    return C.planNight({
      wake: w ? w.rise : n.wake, bedtime: w ? w.bed : null, need: n.need, latency: n.latency,
      caffeine: n.caffeine, smoker: n.smoker, contraceptive: n.contraceptive, pregnant: n.pregnant
    });
  }

  // =====================================================================
  // Dashboard
  // =====================================================================
  function render() {
    root.innerHTML = [
      '<header class="sl-head"><h1 class="sl-h1">' + icon('bed') + ' ' + esc(T('title')) + '</h1><p class="sl-muted">' + esc(T('subtitle')) + '</p></header>',
      renderRouteCard(), renderProgramCard(), renderDiaryCard(), renderStatsCard(), renderNightCard(), renderToolsCard(), renderDataCard(),
      renderEvidence(), '<p class="sl-disclaimer">' + esc(T('disclaimer')) + '</p>'
    ].join('');
    renderHome();
  }

  function notesHtml(res) {
    if (!res || !res.notes.length) return '';
    return res.notes.map(function (n) {
      return '<p class="sl-note' + (n === 'crisis' ? ' sl-note-crisis' : '') + '" role="note">' + icon(n === 'crisis' ? 'heart' : 'triangle-exclamation') + ' ' + esc(T('note.' + n)) + '</p>';
    }).join('');
  }

  function renderRouteCard() {
    var res = checkResult();
    if (!res) {
      return '<section class="sl-card sl-card-hero"><h2 class="sl-h2">' + esc(T('check.cta.title')) + '</h2><p>' + esc(T('check.cta.text')) + '</p>' +
        btn('check-open', icon('clipboard-check') + ' ' + esc(T('check.cta.btn')), 'sl-btn-primary sl-btn-block') + '</section>';
    }
    var steps = '';
    if (res.route === 'optimize') steps = list(['route.optimize.1', 'route.optimize.2', 'route.optimize.3', 'route.optimize.4']);
    if (res.route === 'gentle') steps = list(['route.gentle.1', 'route.gentle.2', 'route.gentle.3', 'route.gentle.4']);
    return '<section class="sl-card"><span class="sl-pill">' + esc(T('route.' + res.route)) + '</span>' +
      '<p class="sl-lead">' + esc(T('route.' + res.route + '.text')) + '</p>' +
      (res.route === 'gentle' ? '<p class="sl-muted">' + esc(T('route.gentle.why')) + '</p>' : '') +
      (steps ? '<p class="sl-label">' + esc(T('route.steps')) + '</p>' + steps : '') +
      notesHtml(res) +
      '<div class="sl-row">' + btn('check-open', esc(T('check.redo')), 'sl-btn-ghost') + '</div></section>';
  }

  function list(keys) {
    return '<ol class="sl-list">' + keys.map(function (k) { return '<li>' + esc(T(k)) + '</li>'; }).join('') + '</ol>';
  }

  function renderProgramCard() {
    var res = checkResult(), p = data.program;
    if (!p) {
      if (!res || res.route !== 'reset') return '';
      if (res.acute) {
        return '<section class="sl-card"><h2 class="sl-h2">' + icon('seedling') + ' ' + esc(T('acute.title')) + '</h2>' +
          list(['acute.1', 'acute.2', 'acute.3', 'acute.4', 'acute.5']) +
          '<p class="sl-ev">' + esc(T('acute.ev')) + ' ' + pubmed(25515106, 'Ellis 2015') + '</p>' +
          btn('program-baseline', esc(T('acute.startProgram')), 'sl-btn-ghost') + '</section>';
      }
      return '<section class="sl-card"><h2 class="sl-h2">' + icon('calendar-check') + ' ' + esc(T('prog.title')) + '</h2><p>' + esc(T('prog.intro')) + '</p>' +
        btn('program-baseline', esc(T('prog.startBaseline')), 'sl-btn-primary sl-btn-block') + '</section>';
    }
    if (p.phase === 'baseline') {
      var n = recent(7).length;
      return '<section class="sl-card"><h2 class="sl-h2">' + icon('calendar-check') + ' ' + esc(T('prog.baseline.title')) + '</h2>' +
        '<p>' + esc(T('prog.baseline.text')) + '</p><p class="sl-lead">' + esc(T('prog.baseline.count', { n: n })) + '</p>' +
        progressBar(Math.min(n, 7), 7) +
        '<div class="sl-row">' + (n >= C.PROGRAM.MIN_BASELINE ? btn('program-start-open', esc(T('prog.baseline.ready')), 'sl-btn-primary') : '') +
        btn('program-cancel', esc(T('prog.cancel')), 'sl-btn-ghost') + '</div></section>';
    }
    if (p.phase === 'done') {
      return '<section class="sl-card"><h2 class="sl-h2">' + icon('flag-checkered') + ' ' + esc(T('prog.done.title')) + '</h2><p>' + esc(T('prog.finished')) + '</p>' +
        '<div class="sl-row">' + btn('week-open', esc(T('prog.seeWeek', { w: 6 })), 'sl-btn-ghost', 6) + btn('summary-open', esc(T('prog.summary')), 'sl-btn-ghost') + '</div></section>';
    }
    var w = Math.min(currentWeek(), 6), win = programWindow(), finished = currentWeek() > 6;
    var nextReview = C.addDays(p.lastReview, 7);
    var html = '<section class="sl-card sl-card-program"><div class="sl-row sl-between"><h2 class="sl-h2">' + icon('calendar-check') + ' ' +
      esc(finished ? T('prog.done.title') : T('prog.week', { w: w })) + '</h2></div>' +
      (finished ? '<p>' + esc(T('prog.done.text')) + '</p>' : progressBar(w, 6)) +
      '<div class="sl-window"><p class="sl-label">' + esc(T('prog.window')) + '</p><p class="sl-lead">' +
      T('prog.windowLine', { bed: esc(fmtClock(win.bed)), rise: esc(fmtClock(win.rise)) }) + '</p><p class="sl-muted">' +
      esc(T('prog.windowLen', { d: fmtDur(win.window) })) + '</p></div>';
    if (reviewDue()) html += btn('review-open', icon('sliders') + ' ' + esc(T('prog.reviewDue')), 'sl-btn-primary sl-btn-block');
    else html += '<p class="sl-muted">' + esc(T('prog.reviewIn', { d: fmtDay(nextReview, { weekday: 'long', day: 'numeric', month: 'short' }) })) + '</p>';
    if (w <= 3 && !finished) html += '<p class="sl-note">' + icon('triangle-exclamation') + ' ' + esc(T('prog.drowsy')) + '</p>';
    html += '<div class="sl-row">' + btn('week-open', esc(T('prog.seeWeek', { w: w })), 'sl-btn-ghost', w) +
      (finished ? btn('summary-open', esc(T('prog.summary')), 'sl-btn-ghost') + btn('program-finish', esc(T('prog.finish')), 'sl-btn-ghost')
        : btn('program-cancel', esc(T('prog.cancel')), 'sl-btn-ghost sl-btn-quiet')) + '</div></section>';
    return html;
  }

  function progressBar(v, max) {
    return '<div class="sl-progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + max + '" aria-valuenow="' + v + '"><span style="width:' +
      Math.round(100 * v / max) + '%"></span></div>';
  }

  function renderDiaryCard() {
    var t = todayKey(), e = data.diary[t], m = e ? C.entryMetrics(e) : null;
    var html = '<section class="sl-card"><h2 class="sl-h2">' + icon('book-open') + ' ' + esc(T('diary.title')) + '</h2>';
    if (m) {
      html += '<p class="sl-label">' + esc(T('diary.last')) + '</p><p class="sl-lead">' +
        esc(T('diary.lastLine', { tst: fmtDur(m.tst), sol: fmtDur(m.sol), w: m.wakes })) + '</p>' +
        '<div class="sl-row">' + btn('diary-open', esc(T('edit')), 'sl-btn-ghost', t) + btn('diary-open', esc(T('diary.other')), 'sl-btn-ghost', C.addDays(t, -1)) +
        btn('history-open', esc(T('diary.history')), 'sl-btn-ghost') + '</div>';
    } else {
      html += btn('diary-open', icon('pen') + ' ' + esc(T('diary.cta')), 'sl-btn-primary sl-btn-block', t) +
        '<div class="sl-row">' + btn('diary-open', esc(T('diary.other')), 'sl-btn-ghost', C.addDays(t, -1)) +
        btn('history-open', esc(T('diary.history')), 'sl-btn-ghost') + '</div>';
    }
    var cd = data.closeDay;
    if (cd && (cd.at === t || cd.at === C.addDays(t, -1)) && (cd.todos || cd.worries)) {
      html += '<details class="sl-details"><summary>' + esc(T('cd.yours')) + '</summary>' +
        (cd.todos ? '<p class="sl-pre">' + esc(cd.todos) + '</p>' : '') + (cd.worries ? '<p class="sl-pre">' + esc(cd.worries) + '</p>' : '') + '</details>';
    }
    return html + '</section>';
  }

  function statBox(label, value) { return '<div class="sl-stat"><span class="sl-stat-v">' + esc(value) + '</span><span class="sl-stat-l">' + esc(label) + '</span></div>'; }

  function renderStatsCard() {
    var items = recent(7);
    var html = '<section class="sl-card"><h2 class="sl-h2">' + icon('chart-simple') + ' ' + esc(T('stats.title')) + '</h2>';
    if (!items.length) return html + '<p class="sl-muted">' + esc(T('stats.empty')) + '</p></section>';
    var s = C.summarize(items);
    html += '<div class="sl-stats">' + statBox(T('stat.nights'), s.n) + statBox(T('stat.sleep'), fmtDur(s.avgTST)) + statBox(T('stat.inBed'), fmtDur(s.avgTIB)) +
      statBox(T('stat.eff'), pct(s.se)) + statBox(T('stat.sol'), fmtDur(s.avgSOL)) + statBox(T('stat.waso'), fmtDur(s.avgWASO)) +
      (s.avgRested != null ? statBox(T('stat.rested'), String(s.avgRested)) : '') + '</div>';

    var items14 = recent(14), items28 = recent(28);
    var sri = C.sleepRegularityIndex(items14);
    html += '<h3 class="sl-h3">' + esc(T('stats.regularity')) + '</h3>';
    if (sri && sri.pairs >= 5) {
      html += '<p class="sl-lead">' + esc(T('stats.sri', { v: Math.max(0, sri.sri) })) + '</p>' + progressBar(Math.max(0, sri.sri), 100) +
        '<p class="sl-muted">' + esc(T('stats.sriHelp')) + ' ' + pubmed(37738616, 'Windred 2024') + '</p>';
    } else {
      html += '<p class="sl-muted">' + esc(T('stats.sriNeed')) + '</p>';
    }
    var s14 = C.summarize(items14);
    if (s14 && s14.onsetSD != null) html += '<p>' + esc(T('stats.onsetSD', { d: fmtDur(s14.onsetSD) })) + '</p>';
    var sj = C.socialJetlag(items28);
    if (sj && sj.minutes >= 30) html += '<p>' + esc(T(sj.laterOnFree ? 'stats.sj' : 'stats.sjEarlier', { d: fmtDur(sj.minutes) })) + '</p>';
    html += '<h3 class="sl-h3">' + esc(T('stats.chart')) + '</h3>' + chartSvg(items14) + '<p class="sl-muted sl-small">' + esc(T('stats.chartLegend')) + '</p>';
    html += '<p class="sl-muted sl-small">' + esc(T('stats.noScore')) + ' ' + pubmed(29989248, 'Gavriloff 2018') + '</p>';
    return html + '</section>';
  }

  /* 14 rows (one per night), x axis from 18:00 to 12:00 next day. */
  function chartSvg(items) {
    var W = 360, rowH = 18, top = 18, left = 58, right = 8, start = 360, span = 1080;
    var byKey = {};
    items.forEach(function (i) { byKey[i.key] = i.m; });
    function x(rel) { return left + Math.max(0, Math.min(span, rel - start)) / span * (W - left - right); }
    var t = todayKey(), rows = '', ticks = '';
    [540, 720, 900, 1080, 1260].forEach(function (rel) {
      ticks += '<line x1="' + x(rel) + '" x2="' + x(rel) + '" y1="' + (top - 4) + '" y2="' + (top + 14 * rowH) + '" class="sl-tick"/>' +
        '<text x="' + x(rel) + '" y="' + (top - 7) + '" text-anchor="middle" class="sl-axis">' + C.fmtHM(rel + 720).slice(0, 2) + '</text>';
    });
    for (var i = 13; i >= 0; i--) {
      var key = C.addDays(t, -i), y = top + (13 - i) * rowH, m = byKey[key];
      rows += '<text x="' + (left - 6) + '" y="' + (y + 12) + '" text-anchor="end" class="sl-axis">' +
        esc(fmtDay(key, { weekday: 'short', day: 'numeric' })) + '</text>';
      if (m) {
        rows += '<rect x="' + x(m.bedRel) + '" y="' + (y + 3) + '" width="' + Math.max(2, x(m.oobRel) - x(m.bedRel)) + '" height="' + (rowH - 6) + '" rx="3" class="sl-bar-bed"/>' +
          '<rect x="' + x(m.onsetRel) + '" y="' + (y + 3) + '" width="' + Math.max(2, x(m.fwRel) - x(m.onsetRel)) + '" height="' + (rowH - 6) + '" rx="3" class="sl-bar-sleep"/>';
      } else {
        rows += '<line x1="' + left + '" x2="' + (W - right) + '" y1="' + (y + rowH / 2) + '" y2="' + (y + rowH / 2) + '" class="sl-missing"/>';
      }
    }
    return '<svg class="sl-chart" viewBox="0 0 ' + W + ' ' + (top + 14 * rowH + 4) + '" role="img" aria-label="' + esc(T('stats.chart')) + '">' + ticks + rows + '</svg>';
  }

  function renderNightCard() {
    var plan = nightPlan();
    var html = '<section class="sl-card"><div class="sl-row sl-between"><h2 class="sl-h2">' + icon('moon') + ' ' + esc(T('night.title')) + '</h2>' +
      btn('night-open', esc(T('night.adjust')), 'sl-btn-ghost sl-btn-small') + '</div><p class="sl-muted">' +
      esc(programWindow() ? T('night.fromProgram') : T('night.subtitle')) + '</p>';
    if (plan) {
      html += '<ul class="sl-timeline">' + plan.items.map(function (it) {
        if (it.id === 'caffeine' && it.none) return '<li><span class="sl-time">' + icon('mug-hot') + '</span><span>' + esc(T('it.caffeineNone')) + '</span></li>';
        var label = esc(T('it.' + it.id));
        if (it.id === 'caffeine') label += '<span class="sl-muted sl-small"> · ' + esc(T('it.caffeineNote', { h: String(it.hours) })) + '</span>';
        if (it.id === 'dinner') label += '<span class="sl-muted sl-small"> · ' + esc(T('it.alcohol')) + '</span>';
        return '<li class="sl-it-' + it.id + '"><span class="sl-time">' + esc(fmtClock(it.time)) + (it.until ? '–' + esc(fmtClock(it.until)) : '') + '</span><span>' + label + '</span></li>';
      }).join('') + '</ul>';
      html += btn('calendar-night', icon('calendar-plus') + ' ' + esc(T('night.calendar')), 'sl-btn-ghost') +
        '<p class="sl-muted sl-small">' + esc(T('night.calendarHelp')) + '</p>';
    }
    return html + '</section>';
  }

  function renderToolsCard() {
    return '<section class="sl-card"><h2 class="sl-h2">' + icon('star-and-crescent') + ' ' + esc(T('tools.title')) + '</h2>' +
      '<button type="button" class="sl-btn sl-btn-night sl-btn-block" data-sl="cant-open">' + icon('eye') + ' <span><b>' + esc(T('tools.cant')) + '</b><br><span class="sl-small">' + esc(T('tools.cantText')) + '</span></span></button>' +
      '<div class="sl-grid2">' + btn('closeday-open', icon('list-check') + ' ' + esc(T('tools.close')), 'sl-btn-ghost') +
      btn('shuffle-open', icon('shuffle') + ' ' + esc(T('tools.shuffle')), 'sl-btn-ghost') +
      btn('breath-lab', icon('lungs') + ' ' + esc(T('tools.breath')), 'sl-btn-ghost') + '</div></section>';
  }

  function renderDataCard() {
    return '<section class="sl-card"><h2 class="sl-h2">' + icon('shield-halved') + ' ' + esc(T('data.title')) + '</h2><p class="sl-muted">' + esc(T('data.text')) + '</p>' +
      '<p class="sl-muted sl-small">' + esc(T('data.install')) + '</p><div class="sl-grid2">' +
      btn('export-json', icon('download') + ' ' + esc(T('data.backup')), 'sl-btn-ghost') + btn('export-csv', icon('table') + ' ' + esc(T('data.csv')), 'sl-btn-ghost') +
      btn('import', icon('upload') + ' ' + esc(T('data.import')), 'sl-btn-ghost') + btn('delete-all', icon('trash') + ' ' + esc(T('data.delete')), 'sl-btn-ghost sl-btn-danger') +
      '</div><input type="file" id="sl-import-file" accept=".json,application/json" hidden></section>';
  }

  function renderEvidence() {
    return '<details class="sl-card sl-details"><summary class="sl-h2">' + icon('flask') + ' ' + esc(T('evidence')) + '</summary><ul class="sl-ev-list">' +
      EVIDENCE.map(function (e) { return '<li>' + esc(T(e[0])) + ': ' + pubmed(e[2], e[1]) + '</li>'; }).join('') + '</ul></details>';
  }

  // ---------- Home entry card ----------
  function renderHome() {
    if (!homeCta) return;
    var res = checkResult(), p = data.program, t = todayKey(), text, action, label;
    if (!res) { text = T('home.start'); action = 'home-check'; label = T('home.startBtn'); }
    else if (p && p.phase === 'active') {
      var w = programWindow();
      text = T('home.program', { w: Math.min(6, currentWeek()), bed: fmtClock(w.bed), rise: fmtClock(w.rise) });
      action = 'home-open'; label = T('home.openBtn');
    } else if (p && p.phase === 'baseline') { text = T('home.baseline', { n: recent(7).length }); action = data.diary[t] ? 'home-open' : 'home-log'; label = data.diary[t] ? T('home.openBtn') : T('home.logBtn'); }
    else if (!data.diary[t]) { text = T('home.log'); action = 'home-log'; label = T('home.logBtn'); }
    else {
      var plan = nightPlan(), caf = plan && plan.items.filter(function (i) { return i.id === 'caffeine' && !i.none; })[0];
      text = T('home.night', { bed: plan ? fmtClock(plan.bedtime) : '--', cafe: caf ? T('home.cafe', { t: fmtClock(caf.time) }) : '' });
      action = 'home-open'; label = T('home.openBtn');
    }
    homeCta.innerHTML = '<div class="sl-home"><div class="sl-home-inner"><span class="sl-pill">' + esc(T('home.badge')) + '</span>' +
      '<h2 class="sl-h2">' + icon('bed') + ' ' + esc(T('home.title')) + '</h2><p>' + esc(text) + '</p>' +
      btn(action, esc(label) + ' ' + icon('arrow-right'), 'sl-btn-primary') + '</div></div>';
  }

  // =====================================================================
  // Modals
  // =====================================================================
  var MODALS = {};

  function openModal(name, opts) {
    if (!ui.modal) ui.opener = document.activeElement;
    ui.modal = { name: name, opts: opts || {} };
    var el = document.getElementById('sl-modal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'sl-modal';
      el.setAttribute('data-no-translate', '');
      document.body.appendChild(el);
    }
    paintModal();
    document.body.classList.add('sl-lock');
    var focusEl = el.querySelector('h2, [data-autofocus]');
    if (focusEl) { focusEl.setAttribute('tabindex', '-1'); focusEl.focus(); }
  }

  function paintModal() {
    var el = document.getElementById('sl-modal');
    if (!el || !ui.modal) return;
    var m = MODALS[ui.modal.name](ui.modal.opts);
    var dark = m.dark ? ' sl-modal-night' : '';
    el.className = 'sl-modal' + dark;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', m.title);
    el.innerHTML = '<div class="sl-sheet"><div class="sl-sheet-head"><h2 class="sl-h2">' + esc(m.title) + '</h2>' +
      '<button type="button" class="sl-x" data-sl="modal-close" aria-label="' + esc(T('close')) + '">' + icon('xmark') + '</button></div>' +
      '<div class="sl-sheet-body">' + m.body + '</div></div>';
    if (m.after) m.after(el);
  }

  function closeModal() {
    stopShuffle(); stopPacer();
    var el = document.getElementById('sl-modal');
    if (el) el.remove();
    document.body.classList.remove('sl-lock');
    ui.modal = null; ui.form = null;
    render();
    if (ui.opener && document.contains(ui.opener)) ui.opener.focus();
  }

  function chips(field, options, current, extraCls) {
    return '<div class="sl-chips ' + (extraCls || '') + '" role="group">' + options.map(function (o) {
      var on = String(o.v) === String(current);
      return '<button type="button" class="sl-chip" data-sl="chip" data-field="' + field + '" data-v="' + esc(o.v) + '" aria-pressed="' + on + '">' + esc(o.l) + '</button>';
    }).join('') + '</div>';
  }
  function minOpts(list) { return list.map(function (v) { return { v: v, l: v >= 60 && v % 60 === 0 ? T('hours', { h: v / 60 }) : (v >= 60 ? fmtDur(v) : T('minutes', { n: v })) }; }); }

  // ---------- Initial check ----------
  MODALS.check = function () {
    var c = ui.check, a = c.answers, body = '';
    var steps = ['main', 'nights', 'duration', 'senior', 'flags', 'result'];
    var dots = '<div class="sl-dots">' + steps.slice(0, 5).map(function (s, i) { return '<span' + (steps.indexOf(c.step) >= i ? ' class="on"' : '') + '></span>'; }).join('') + '</div>';
    function options(name, vals) {
      return '<div class="sl-options">' + vals.map(function (v) {
        return '<button type="button" class="sl-option" data-sl="check-answer" data-field="' + name + '" data-v="' + v + '" aria-pressed="' + (String(a[name]) === v) + '">' +
          esc(T(v === 'true' ? 'yes' : v === 'false' ? 'no' : 'check.' + name + '.' + v)) + '</button>';
      }).join('') + '</div>';
    }
    if (c.step === 'main') body = '<p class="sl-q">' + esc(T('check.q.main')) + '</p>' + options('main', ['good', 'onset', 'maintenance', 'unrefreshed']);
    if (c.step === 'nights') body = '<p class="sl-q">' + esc(T('check.q.nights')) + '</p>' + options('nights', ['few', 'most']);
    if (c.step === 'duration') body = '<p class="sl-q">' + esc(T('check.q.duration')) + '</p>' + options('duration', ['lt3m', 'gt3m']);
    if (c.step === 'senior') body = '<p class="sl-q">' + esc(T('check.q.senior')) + '</p>' + options('senior', ['true', 'false']);
    if (c.step === 'flags') {
      body = '<p class="sl-q">' + esc(T('check.q.flags')) + '</p><p class="sl-muted">' + esc(T('check.flags.help')) + '</p><div class="sl-checks">' +
        C.ALL_FLAGS.map(function (f) {
          return '<label class="sl-check"><input type="checkbox" data-sl-flag="' + f + '"' + (a.flags.indexOf(f) !== -1 ? ' checked' : '') + '> <span>' + esc(T('flag.' + f)) + '</span></label>';
        }).join('') + '</div>' + btn('check-finish', esc(T('check.seeResult')), 'sl-btn-primary sl-btn-block');
    }
    if (c.step === 'result') {
      var res = C.routeCheck(a);
      body = '<span class="sl-pill">' + esc(T('route.' + res.route)) + '</span><p class="sl-lead">' + esc(T('route.' + res.route + '.text')) + '</p>' +
        (res.acute ? '<p>' + esc(T('route.reset.acute')) + '</p>' : '') +
        (res.route === 'gentle' ? '<p class="sl-muted">' + esc(T('route.gentle.why')) + '</p>' : '') + notesHtml(res) +
        btn('modal-close', esc(T('close')), 'sl-btn-primary sl-btn-block');
    }
    var back = (c.history.length && c.step !== 'result') ? btn('check-back', icon('arrow-left') + ' ' + esc(T('back')), 'sl-btn-ghost sl-btn-small') : '';
    return { title: T('check.title'), body: (c.step !== 'result' ? dots : '') + body + '<div class="sl-row">' + back + '</div>' };
  };

  function checkGo(step) { ui.check.history.push(ui.check.step); ui.check.step = step; paintModal(); }

  // ---------- Diary form ----------
  MODALS.diary = function (opts) {
    var key = opts.key, f = ui.form, t = todayKey();
    var dayChoices = [0, 1, 2].map(function (i) {
      var k = C.addDays(t, -i);
      return '<button type="button" class="sl-chip" data-sl="diary-day" data-arg="' + k + '" aria-pressed="' + (k === key) + '">' +
        esc(T(i === 0 ? 'diary.today' : i === 1 ? 'diary.yesterday' : 'diary.before')) + (data.diary[k] ? ' ✓' : '') + '</button>';
    }).join('');
    var errs = (ui.form._errors || []).map(function (e) { return '<p class="sl-error" role="alert">' + esc(T('err.' + e)) + '</p>'; }).join('');
    var body = '<div class="sl-chips">' + dayChoices + '</div><p class="sl-label">' + esc(nightLabel(key)) + '</p>' +
      '<p class="sl-muted sl-small">' + esc(T('diary.estimate')) + '</p>' +
      timeField('bed', T('diary.bed'), f.bed) +
      '<p class="sl-label">' + esc(T('diary.sol')) + '</p>' + chips('sol', minOpts([5, 10, 20, 30, 45, 60, 90, 120]), f.sol) +
      '<p class="sl-label">' + esc(T('diary.wakes')) + '</p>' + chips('wakes', [0, 1, 2, 3, 4, 5].map(function (v) { return { v: v, l: v === 0 ? T('diary.none') : v === 5 ? '5+' : String(v) }; }), f.wakes) +
      '<div id="sl-waso"' + (Number(f.wakes) === 0 ? ' hidden' : '') + '><p class="sl-label">' + esc(T('diary.waso')) + '</p>' +
      chips('waso', minOpts([5, 10, 20, 30, 45, 60, 90, 120, 180]), f.waso) + '</div>' +
      timeField('finalWake', T('diary.finalWake'), f.finalWake) + timeField('outOfBed', T('diary.outOfBed'), f.outOfBed) +
      '<p class="sl-label">' + esc(T('diary.nap')) + '</p>' + chips('nap', [{ v: 0, l: T('diary.none') }].concat(minOpts([15, 30, 60, 90, 120])), f.nap) +
      '<p class="sl-label">' + esc(T('diary.rested')) + '</p>' + chips('rested', [1, 2, 3, 4, 5].map(function (v) {
        return { v: v, l: v === 1 ? '1 · ' + T('diary.rested.low') : v === 5 ? '5 · ' + T('diary.rested.high') : String(v) };
      }), f.rested) +
      '<label class="sl-check"><input type="checkbox" id="sl-free"' + (f.free ? ' checked' : '') + '> <span>' + esc(T('diary.free')) + '</span></label>' +
      errs + '<div class="sl-row">' + btn('diary-save', icon('check') + ' ' + esc(T('save')), 'sl-btn-primary') +
      (data.diary[key] ? btn('diary-delete', esc(T('delete')), 'sl-btn-ghost sl-btn-danger') : '') + '</div>';
    return { title: T('diary.title'), body: body };
  };

  function timeField(field, label, value) {
    return '<label class="sl-field"><span class="sl-label">' + esc(label) + '</span><input type="time" class="sl-input" data-sl-time="' + field + '" value="' + esc(value || '') + '" required></label>';
  }

  function diaryDefaults(key) {
    var existing = data.diary[key];
    if (existing) return JSON.parse(JSON.stringify(existing));
    var keys = Object.keys(data.diary).sort(), last = keys.length ? data.diary[keys[keys.length - 1]] : null;
    var w = programWindow();
    var wd = C.weekday(key);
    return {
      bed: w ? w.bed : (last ? last.bed : '23:00'),
      sol: last ? last.sol : 20, wakes: last ? last.wakes : 1, waso: last ? last.waso : 20,
      finalWake: w ? w.rise : (last ? last.finalWake : data.night.wake),
      outOfBed: w ? w.rise : (last ? last.outOfBed : data.night.wake),
      nap: 0, rested: null, free: wd === 0 || wd === 6
    };
  }

  // ---------- History ----------
  MODALS.history = function () {
    var keys = Object.keys(data.diary).sort().reverse().slice(0, 60), t = todayKey();
    if (!keys.length) return { title: T('diary.historyTitle'), body: '<p class="sl-muted">' + esc(T('diary.empty')) + '</p>' };
    return {
      title: T('diary.historyTitle'),
      body: '<ul class="sl-history">' + keys.map(function (k) {
        var m = C.entryMetrics(data.diary[k]);
        var editable = C.daysBetween(k, t) <= 2;
        return '<li><span><b>' + esc(fmtDay(k, { weekday: 'short', day: 'numeric', month: 'short' })) + '</b><br><span class="sl-muted sl-small">' +
          esc(fmtClock(data.diary[k].bed) + ' → ' + fmtClock(data.diary[k].outOfBed)) + '</span></span><span>' + esc(fmtDur(m.tst)) + ' · ' + esc(pct(m.se)) + '</span>' +
          (editable ? btn('diary-open', esc(T('edit')), 'sl-btn-ghost sl-btn-small', k) : '') + '</li>';
      }).join('') + '</ul>'
    };
  };

  // ---------- My night settings ----------
  MODALS.night = function () {
    var n = ui.night, w = programWindow();
    var body = (w ? '<p class="sl-note">' + icon('calendar-check') + ' ' + esc(T('night.fromProgram')) + '</p>' :
      timeField('wake', T('nightf.wake'), n.wake) +
      '<p class="sl-label">' + esc(T('nightf.need')) + '</p>' + chips('need', [420, 450, 480, 510, 540].map(function (v) { return { v: v, l: fmtDur(v) }; }), n.need) +
      '<p class="sl-muted sl-small">' + esc(T('nightf.needHelp')) + ' ' + pubmed(29073412, 'Hirshkowitz 2015') + '</p>' +
      '<p class="sl-label">' + esc(T('nightf.latency')) + '</p>' + chips('latency', minOpts([5, 10, 15, 20, 30]), n.latency)) +
      '<p class="sl-label">' + esc(T('nightf.caffeine')) + '</p>' + chips('caffeine', ['none', 'one', 'two'].map(function (v) { return { v: v, l: T('caf.' + v) }; }), n.caffeine) +
      '<p class="sl-muted">' + esc(T('nightf.factors')) + '</p>' +
      ['smoker', 'contraceptive', 'pregnant'].map(function (k) {
        return '<label class="sl-check"><input type="checkbox" data-sl-factor="' + k + '"' + (n[k] ? ' checked' : '') + '> <span>' + esc(T('nightf.' + k)) + '</span></label>';
      }).join('') +
      '<p class="sl-muted sl-small">' + pubmed(36870101, 'Gardiner 2023') + ' · ' + pubmed(35298459, 'Brown 2022') + ' · ' + pubmed(31102877, 'Haghayegh 2019') + ' · ' + pubmed(40234380, 'Leota 2025') + '</p>' +
      '<div class="sl-row">' + btn('night-save', icon('check') + ' ' + esc(T('save')), 'sl-btn-primary') + '</div>';
    return { title: T('nightf.title'), body: body };
  };

  // ---------- Program start ----------
  MODALS.programStart = function () {
    var f = ui.form, items = recent(7), s = C.summarize(items);
    if (!s) return { title: T('start.title'), body: '<p class="sl-muted">' + esc(T('prog.baseline.count', { n: 0 })) + '</p>' };
    if (s.avgTIB < C.PROGRAM.FLOOR) {
      return { title: T('start.title'), body: '<p class="sl-note">' + esc(T('prog.lowTib')) + '</p>' + btn('use-gentle', esc(T('prog.useGentle')), 'sl-btn-primary sl-btn-block', 'lowTib') };
    }
    var iw = C.initialWindow(s, f.mode);
    var body = '<p class="sl-label">' + esc(T('start.baseline', { n: s.n })) + '</p><div class="sl-stats">' +
      statBox(T('stat.sleep'), fmtDur(s.avgTST)) + statBox(T('stat.inBed'), fmtDur(s.avgTIB)) + statBox(T('stat.eff'), pct(s.se)) +
      statBox(T('stat.sol'), fmtDur(s.avgSOL)) + statBox(T('stat.waso'), fmtDur(s.avgWASO)) + '</div>' +
      '<p class="sl-label">' + esc(T('start.safety')) + '</p><ul class="sl-list sl-list-flags">' +
      C.GATE_FLAGS.map(function (g) { return '<li>' + esc(T('flag.' + g)) + '</li>'; }).join('') + '</ul>' +
      '<label class="sl-check"><input type="checkbox" id="sl-safety"' + (f.safety ? ' checked' : '') + '> <span><b>' + esc(T('start.safetyOk')) + '</b></span></label>' +
      timeField('rise', T('start.rise'), f.rise) +
      '<p class="sl-label">' + esc(T('start.mode')) + '</p><div class="sl-options">' + ['gentle', 'standard'].map(function (m) {
        return '<button type="button" class="sl-option" data-sl="chip" data-field="mode" data-v="' + m + '" aria-pressed="' + (f.mode === m) + '"><b>' + esc(T('mode.' + m)) + '</b><br><span class="sl-small">' + esc(T('mode.' + m + '.text')) + '</span></button>';
      }).join('') + '</div>' +
      '<p class="sl-lead" id="sl-preview">' + T('start.preview', { bed: esc(fmtClock(C.bedtimeFor(f.rise, iw.window))), rise: esc(fmtClock(f.rise)), d: esc(fmtDur(iw.window)) }) + '</p>' +
      '<p class="sl-note">' + icon('triangle-exclamation') + ' ' + esc(T('prog.drowsy')) + '</p>' +
      '<p class="sl-muted sl-small">' + pubmed(22946736, 'Troxel 2012') + ' · ' + pubmed(40205789, 'Jernelöv 2025') + ' · ' + pubmed(24497651, 'Kyle 2014') + '</p>' +
      '<div class="sl-row">' + btn('program-start', esc(T('start.btn')), 'sl-btn-primary') + btn('use-gentle', esc(T('start.safetyNo')), 'sl-btn-ghost', 'flag') + '</div>';
    return { title: T('start.title'), body: body };
  };

  // ---------- Program weeks ----------
  MODALS.week = function (opts) {
    var w = opts.week, cur = Math.min(currentWeek() || 1, 6), done = data.program && data.program.phase === 'done';
    var tabs = '<div class="sl-chips">' + [1, 2, 3, 4, 5, 6].map(function (i) {
      var open = done || i <= cur;
      return '<button type="button" class="sl-chip" data-sl="week-open" data-arg="' + i + '" aria-pressed="' + (i === w) + '"' + (open ? '' : ' disabled') + '>' + i + '</button>';
    }).join('') + '</div>';
    var win = programWindow(), body = tabs;
    if (!done && w > cur) return { title: T('w' + w + '.title'), body: body + '<p class="sl-muted">' + esc(T('week.locked', { w: w })) + '</p>' };
    body += '<p class="sl-lead">' + esc(T('w' + w + '.text')) + '</p>';
    if (w === 1) {
      if (win) body += '<p>' + T('prog.windowLine', { bed: esc(fmtClock(win.bed)), rise: esc(fmtClock(win.rise)) }) + '</p>';
      body += '<p class="sl-label">' + esc(T('w1.rules')) + '</p>' + list(['w1.r1', 'w1.r2', 'w1.r3', 'w1.r4']) +
        '<p class="sl-muted sl-small">' + pubmed(38231522, 'Furukawa 2024') + ' · ' + pubmed(37496454, 'Jansson-Fröjmark 2024') + '</p>';
    }
    if (w === 4) body += '<p class="sl-label">' + esc(T('w4.beliefs')) + '</p>' + list(['w4.b1', 'w4.b2', 'w4.b3', 'w4.b4', 'w4.b5']) +
      '<p class="sl-muted sl-small">' + pubmed(34405469, 'Jansson-Fröjmark 2022') + ' · ' + pubmed(38231522, 'Furukawa 2024') + '</p>';
    if (w === 6) body += list(['w6.1', 'w6.2', 'w6.3', 'w6.4']);
    body += '<div class="sl-action"><p class="sl-label">' + icon('bullseye') + ' ' + esc(T('week.action')) + '</p><p>' + esc(T('w' + w + '.action')) + '</p>';
    if (w === 1 && win) body += btn('calendar-window', icon('calendar-plus') + ' ' + esc(T('w1.calendar')), 'sl-btn-ghost');
    if (w === 2) body += btn('night-open', esc(T('w2.btn')), 'sl-btn-ghost');
    if (w === 3) body += btn('closeday-open', esc(T('w3.btn')), 'sl-btn-ghost') + '<p class="sl-muted sl-small">' + pubmed(29058942, 'Scullin 2018') + '</p>';
    if (w === 5) {
      body += '<div class="sl-grid2">' + btn('shuffle-open', esc(T('w5.shuffle')) + '<br><span class="sl-small">' + esc(T('w5.shuffleEv')) + '</span>', 'sl-btn-ghost') +
        btn('breath-lab', esc(T('w5.breath')) + '<br><span class="sl-small">' + esc(T('w5.breathEv')) + '</span>', 'sl-btn-ghost') +
        btn('music', esc(T('w5.music')) + '<br><span class="sl-small">' + esc(T('w5.musicEv')) + '</span>', 'sl-btn-ghost') + '</div>';
    }
    if (w === 6) body += btn('summary-open', esc(T('prog.summary')), 'sl-btn-ghost');
    body += '</div>';
    return { title: T('w' + w + '.title'), body: body };
  };

  // ---------- Weekly review ----------
  MODALS.review = function () {
    var p = data.program;
    if (!p || p.phase !== 'active') return { title: T('rev.title'), body: '<p class="sl-muted">' + esc(T('sum.none')) + '</p>' };
    var items = reviewItems(), s = C.summarize(items);
    var r = C.weeklyReview({ window: p.window, target: p.target, phase: p.wphase }, s);
    ui.form = { review: r, summary: s };
    var body = '<p>' + esc(T('rev.nights', { n: s ? s.n : 0 })) + '</p>';
    if (s) body += '<p>' + esc(T('rev.good', { c: s.consolidated, n: s.n })) + '</p><div class="sl-stats">' + statBox(T('stat.sleep'), fmtDur(s.avgTST)) +
      statBox(T('stat.eff'), pct(s.se)) + statBox(T('stat.sol'), fmtDur(s.avgSOL)) + statBox(T('stat.waso'), fmtDur(s.avgWASO)) + '</div>';
    body += '<p class="sl-lead">' + esc(T('rev.' + r.decision)) + '</p>';
    if (r.window !== p.window) {
      body += '<p>' + T('rev.newWindow', { bed: esc(fmtClock(C.bedtimeFor(p.rise, r.window))), rise: esc(fmtClock(p.rise)), d: esc(fmtDur(r.window)) }) + '</p>' +
        '<div class="sl-row">' + btn('review-apply', esc(T('rev.apply')), 'sl-btn-primary') + btn('review-keep', esc(T('rev.keep')), 'sl-btn-ghost') + '</div>';
    } else {
      body += '<div class="sl-row">' + btn('review-apply', esc(T('rev.ok')), 'sl-btn-primary') + '</div>';
    }
    return { title: T('rev.title'), body: body };
  };

  // ---------- Summary ----------
  function summaryData() {
    var p = data.program;
    var before = p && p.baseline, after = C.summarize(recent(7));
    return { before: before, after: after };
  }
  MODALS.summary = function () {
    var d = summaryData();
    if (!d.before || !d.after) return { title: T('sum.title'), body: '<p class="sl-muted">' + esc(T('sum.none')) + '</p>' };
    function row(label, a, b) { return '<tr><th scope="row">' + esc(label) + '</th><td>' + esc(a) + '</td><td>' + esc(b) + '</td></tr>'; }
    var body = '<table class="sl-table"><thead><tr><th></th><th>' + esc(T('sum.before')) + '</th><th>' + esc(T('sum.after')) + '</th></tr></thead><tbody>' +
      row(T('stat.sol'), fmtDur(d.before.avgSOL), fmtDur(d.after.avgSOL)) + row(T('stat.waso'), fmtDur(d.before.avgWASO), fmtDur(d.after.avgWASO)) +
      row(T('stat.sleep'), fmtDur(d.before.avgTST), fmtDur(d.after.avgTST)) + row(T('stat.inBed'), fmtDur(d.before.avgTIB), fmtDur(d.after.avgTIB)) +
      row(T('stat.eff'), pct(d.before.se), pct(d.after.se)) + '</tbody></table>' +
      btn('summary-share', icon('share-nodes') + ' ' + esc(T('sum.share')), 'sl-btn-ghost');
    return { title: T('sum.title'), body: body };
  };
  function summaryText() {
    var d = summaryData();
    if (!d.before || !d.after) return '';
    return ['SLEEP_LAB · ' + T('sum.title'), '', '            ' + T('sum.before') + ' → ' + T('sum.after'),
      T('stat.sol') + ': ' + fmtDur(d.before.avgSOL) + ' → ' + fmtDur(d.after.avgSOL),
      T('stat.waso') + ': ' + fmtDur(d.before.avgWASO) + ' → ' + fmtDur(d.after.avgWASO),
      T('stat.sleep') + ': ' + fmtDur(d.before.avgTST) + ' → ' + fmtDur(d.after.avgTST),
      T('stat.inBed') + ': ' + fmtDur(d.before.avgTIB) + ' → ' + fmtDur(d.after.avgTIB),
      T('stat.eff') + ': ' + pct(d.before.se) + ' → ' + pct(d.after.se), '', todayKey()].join('\n');
  }

  // ---------- I can't sleep (dark) ----------
  MODALS.cant = function (opts) {
    var s = opts.step || 1, body = '<div class="sl-night-steps">';
    if (s === 1) body += '<p class="sl-night-text">' + esc(T('cs.s1')) + '</p>' + btn('cant-step', esc(T('next')), 'sl-btn-night-main', 2) +
      btn('cant-step', esc(T('cs.notYet')), 'sl-btn-night-ghost', 'b');
    if (s === 'b') body += '<p class="sl-night-text">' + esc(T('cs.s1b')) + '</p>' + nightTools() + btn('cant-step', esc(T('back')), 'sl-btn-night-ghost', 1);
    if (s === 2) body += '<p class="sl-night-text">' + esc(T('cs.s2')) + '</p>' + btn('cant-step', esc(T('next')), 'sl-btn-night-main', 3);
    if (s === 3) body += '<p class="sl-night-text">' + esc(T('cs.s3')) + '</p>' + nightTools() + btn('cant-step', esc(T('next')), 'sl-btn-night-main', 4);
    if (s === 4) body += '<p class="sl-night-text">' + esc(T('cs.s4')) + '</p>' + btn('modal-close', esc(T('cs.done')), 'sl-btn-night-main');
    body += '</div><p class="sl-night-ev">' + pubmed(37496454, 'Jansson-Fröjmark 2024') + ' · ' + pubmed(34405469, 'Jansson-Fröjmark 2022') + '</p>';
    return { title: T('cs.title'), body: body, dark: true };
  };
  function nightTools() {
    return '<div class="sl-night-tools">' + btn('pacer-start', esc(T('pacer.title')), 'sl-btn-night-ghost') + btn('shuffle-start', esc(T('sh.title')), 'sl-btn-night-ghost') +
      btn('music', esc(T('cs.sound')), 'sl-btn-night-ghost') + '</div><div id="sl-night-tool"></div>';
  }

  // ---------- Cognitive shuffle (dark) ----------
  MODALS.shuffle = function () {
    return { title: T('sh.title'), dark: true, body: '<div class="sl-night-steps">' + shuffleHtml() + '</div>' };
  };
  function shuffleHtml() {
    var canSpeak = 'speechSynthesis' in window;
    return '<p class="sl-night-small">' + esc(T('sh.help')) + '</p><p class="sl-word" id="sl-word" aria-live="polite">…</p>' +
      (canSpeak ? '<label class="sl-check sl-night-check"><input type="checkbox" id="sl-voice"' + (ui.shuffle && ui.shuffle.voice ? ' checked' : '') + '> <span>' + esc(T('sh.voice')) + '</span></label>' : '') +
      btn('shuffle-stop', esc(T('sh.stop')), 'sl-btn-night-ghost') + '<p class="sl-night-ev">' + esc(T('sh.ev')) + ' ' + pubmed(11863237, 'Harvey 2002') + '</p>';
  }
  function startShuffle(container) {
    stopShuffle();
    var words = WORDS[lang()].slice();
    for (var i = words.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = words[i]; words[i] = words[j]; words[j] = tmp; }
    var st = { idx: 0, words: words, voice: !!(ui.shuffle && ui.shuffle.voice), started: Date.now(), timer: null };
    ui.shuffle = st;
    if (container) container.innerHTML = shuffleHtml();
    function show() {
      if (ui.shuffle !== st) return;
      if (Date.now() - st.started > 15 * 60 * 1000) { stopShuffle(); return; }
      var w = st.words[st.idx++ % st.words.length];
      var el = document.getElementById('sl-word');
      if (el) el.textContent = w;
      var voiceBox = document.getElementById('sl-voice');
      st.voice = !!(voiceBox && voiceBox.checked);
      if (st.voice && 'speechSynthesis' in window) {
        try {
          var u = new SpeechSynthesisUtterance(w);
          u.lang = lang() === 'es' ? 'es-MX' : 'en-US'; u.rate = 0.8; u.pitch = 0.9; u.volume = 0.6;
          window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
        } catch (e) { /* speech is optional */ }
      }
      st.timer = setTimeout(show, 8000);
    }
    show();
  }
  function stopShuffle() {
    if (ui.shuffle && ui.shuffle.timer) clearTimeout(ui.shuffle.timer);
    if (ui.shuffle) ui.shuffle = { voice: ui.shuffle.voice };
    try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    var el = document.getElementById('sl-word');
    if (el) el.textContent = '…';
  }

  // ---------- Breathing pacer (dark, silent) ----------
  function startPacer(container) {
    stopPacer();
    container.innerHTML = '<p class="sl-night-small">' + esc(T('pacer.help')) + '</p><div class="sl-pacer"><div class="sl-pacer-dot" id="sl-pacer-dot"></div>' +
      '<p id="sl-pacer-text" aria-live="polite"></p></div>' + btn('pacer-stop', esc(T('pacer.stop')), 'sl-btn-night-ghost');
    var st = { started: Date.now(), timer: null };
    ui.pacer = st;
    function phase(inhale) {
      if (ui.pacer !== st) return;
      if (Date.now() - st.started > 10 * 60 * 1000) { stopPacer(); return; }
      var dot = document.getElementById('sl-pacer-dot'), txt = document.getElementById('sl-pacer-text');
      if (!dot) return;
      dot.style.transitionDuration = (inhale ? 4 : 6) + 's';
      dot.style.transform = 'scale(' + (inhale ? 1 : 0.45) + ')';
      txt.textContent = T(inhale ? 'pacer.in' : 'pacer.out');
      st.timer = setTimeout(function () { phase(!inhale); }, inhale ? 4000 : 6000);
    }
    requestAnimationFrame(function () { phase(true); });
  }
  function stopPacer() {
    if (ui.pacer && ui.pacer.timer) clearTimeout(ui.pacer.timer);
    ui.pacer = null;
  }

  // ---------- Close the day ----------
  MODALS.closeday = function () {
    var cd = data.closeDay && data.closeDay.at === todayKey() ? data.closeDay : { todos: '', worries: '' };
    return {
      title: T('cd.title'),
      body: '<p class="sl-muted">' + esc(T('cd.help')) + '</p><label class="sl-field"><span class="sl-label">' + esc(T('cd.todos')) + '</span>' +
        '<textarea class="sl-input sl-textarea" id="sl-todos" rows="4" maxlength="2000">' + esc(cd.todos) + '</textarea></label>' +
        '<label class="sl-field"><span class="sl-label">' + esc(T('cd.worries')) + '</span><textarea class="sl-input sl-textarea" id="sl-worries" rows="4" maxlength="2000">' + esc(cd.worries) + '</textarea></label>' +
        '<div class="sl-row">' + btn('closeday-save', icon('check') + ' ' + esc(T('cd.done')), 'sl-btn-primary') + '</div>' +
        '<p class="sl-muted sl-small">' + pubmed(29058942, 'Scullin 2018') + '</p>'
    };
  };

  // =====================================================================
  // Files: download / share
  // =====================================================================
  function deliverFile(name, mime, text, preferShare) {
    var blob = new Blob([text], { type: mime });
    var file = null;
    try { file = new File([blob], name, { type: mime }); } catch (e) { file = null; }
    var touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    if (preferShare && touch && file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: name }).catch(function (err) { if (!err || err.name !== 'AbortError') download(blob, name); });
      return;
    }
    download(blob, name);
  }
  function download(blob, name) {
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function stampUTC() { return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z'); }

  function calendarFile(events, name) {
    var ics = C.buildICS(events.map(function (e) {
      return { uid: 'sleeplab-' + e.id + '@sleeplab', title: e.title, time: e.time, minutes: e.minutes || 15, description: T('cal.desc') };
    }), { startKey: todayKey(), stamp: stampUTC() });
    deliverFile(name, 'text/calendar;charset=utf-8', ics, false);
  }

  // =====================================================================
  // Actions
  // =====================================================================
  var ACTIONS = {
    'modal-close': closeModal,
    'home-check': function () { if (typeof window.showView === 'function') window.showView('sleep'); ACTIONS['check-open'](); },
    'home-open': function () { if (typeof window.showView === 'function') window.showView('sleep'); },
    'home-log': function () { if (typeof window.showView === 'function') window.showView('sleep'); ACTIONS['diary-open'](null, todayKey()); },

    'check-open': function () {
      var prev = data.check ? data.check.answers : null;
      ui.check = { step: 'main', history: [], answers: { main: null, nights: null, duration: null, senior: null, flags: prev ? prev.flags.slice() : [] } };
      openModal('check');
    },
    'check-answer': function (el) {
      var a = ui.check.answers, f = el.getAttribute('data-field'), v = el.getAttribute('data-v');
      a[f] = f === 'senior' ? v === 'true' : v;
      if (f === 'main') return checkGo(v === 'good' ? 'senior' : 'nights');
      if (f === 'nights') return checkGo('duration');
      if (f === 'duration') return checkGo('senior');
      if (f === 'senior') return checkGo('flags');
    },
    'check-back': function () { ui.check.step = ui.check.history.pop() || 'main'; paintModal(); },
    'check-finish': function () {
      var a = ui.check.answers;
      a.flags = Array.prototype.map.call(document.querySelectorAll('[data-sl-flag]:checked'), function (i) { return i.getAttribute('data-sl-flag'); });
      if (a.main === 'good') { a.nights = 'few'; a.duration = 'gt3m'; }
      data.check = { at: new Date().toISOString(), answers: { main: a.main, nights: a.nights, duration: a.duration, senior: a.senior === true, flags: a.flags } };
      data.profile.senior = a.senior === true;
      // A new safety flag ends the sleep window right away
      if (data.program && C.routeCheck(data.check.answers).route === 'gentle') data.program = null;
      if (data.profile.senior && !data.program) data.night.need = Math.min(data.night.need, 450);
      save();
      checkGo('result');
    },

    'diary-open': function (el, keyArg) {
      var key = keyArg || (el && el.getAttribute('data-arg')) || todayKey();
      ui.form = diaryDefaults(key);
      openModal('diary', { key: key });
    },
    'diary-day': function (el) { var key = el.getAttribute('data-arg'); ui.form = diaryDefaults(key); ui.modal.opts.key = key; paintModal(); },
    'diary-save': function () {
      var f = ui.form;
      document.querySelectorAll('[data-sl-time]').forEach(function (i) { f[i.getAttribute('data-sl-time')] = i.value; });
      var free = document.getElementById('sl-free'); f.free = !!(free && free.checked);
      if (Number(f.wakes) === 0) f.waso = 0;
      var errors = C.validateEntry(f);
      if (errors.length) { f._errors = errors; paintModal(); return; }
      var e = C.sanitizeEntry(f);
      if (!e) { f._errors = ['missing']; paintModal(); return; }
      if (f.rested != null) e.rested = Number(f.rested);
      data.diary[ui.modal.opts.key] = e;
      save(); askPersist(); toast(T('saved')); closeModal();
    },
    'diary-delete': function () {
      if (!window.confirm(T('diary.deleteConfirm'))) return;
      delete data.diary[ui.modal.opts.key]; save(); closeModal();
    },
    'history-open': function () { openModal('history'); },

    'chip': function (el) {
      var field = el.getAttribute('data-field'), v = el.getAttribute('data-v');
      var target = ui.modal && ui.modal.name === 'night' ? ui.night : ui.form;
      target[field] = /^\d+$/.test(v) ? Number(v) : v;
      el.parentNode.querySelectorAll('[data-field="' + field + '"]').forEach(function (b) { b.setAttribute('aria-pressed', b === el ? 'true' : 'false'); });
      if (field === 'wakes') { var w = document.getElementById('sl-waso'); if (w) w.hidden = Number(v) === 0; }
      if (field === 'mode' && ui.modal.name === 'programStart') updatePreview();
    },

    'night-open': function () { ui.night = JSON.parse(JSON.stringify(data.night)); openModal('night'); },
    'night-save': function () {
      var n = ui.night, wake = document.querySelector('[data-sl-time="wake"]');
      if (wake && C.parseHM(wake.value) !== null) n.wake = wake.value;
      document.querySelectorAll('[data-sl-factor]').forEach(function (i) { n[i.getAttribute('data-sl-factor')] = i.checked; });
      data.night = C.sanitizeData({ night: n }).night;
      save(); toast(T('saved')); closeModal();
    },
    'calendar-night': function () {
      var plan = nightPlan(); if (!plan) return;
      var ev = [{ id: 'wake', title: T('cal.wake'), time: plan.wake, minutes: 10 }];
      plan.items.forEach(function (it) {
        if (it.id === 'caffeine' && !it.none) ev.push({ id: 'caffeine', title: T('cal.caffeine'), time: it.time, minutes: 10 });
        if (it.id === 'dim') ev.push({ id: 'dim', title: T('cal.dim'), time: it.time, minutes: 15 });
        if (it.id === 'bath') ev.push({ id: 'bath', title: T('cal.bath'), time: it.time, minutes: 20 });
      });
      ev.push({ id: 'bed', title: T('cal.bed'), time: plan.bedtime, minutes: 15 });
      calendarFile(ev, 'sleeplab-mi-noche.ics');
    },
    'calendar-window': function () {
      var w = programWindow(); if (!w) return;
      calendarFile([{ id: 'wake', title: T('cal.wake'), time: w.rise, minutes: 10 }, { id: 'bed', title: T('cal.bed'), time: w.bed, minutes: 15 }], 'sleeplab-ventana.ics');
    },

    'program-baseline': function () {
      data.program = { phase: 'baseline', baselineStart: todayKey() };
      save(); render();
    },
    'program-cancel': function () {
      if (!window.confirm(T('prog.cancelConfirm'))) return;
      data.program = null; save(); render();
    },
    'program-finish': function () {
      if (!window.confirm(T('prog.finishConfirm'))) return;
      data.program.phase = 'done'; save(); render();
    },
    'program-start-open': function () {
      var items = recent(7), s = C.summarize(items);
      var work = items.filter(function (i) { return !i.m.free; });
      var oob = (work.length >= 3 ? work : items).map(function (i) { return i.m.oobRel; });
      var avgOob = oob.reduce(function (a, b) { return a + b; }, 0) / oob.length;
      ui.form = { rise: C.fmtHM(C.round15(avgOob + 720)), mode: 'gentle', safety: false, summary: s };
      openModal('programStart');
    },
    'program-start': function () {
      var f = ui.form, safety = document.getElementById('sl-safety'), rise = document.querySelector('[data-sl-time="rise"]');
      if (rise && C.parseHM(rise.value) !== null) f.rise = rise.value;
      if (!safety || !safety.checked) { safety && safety.focus(); toast(T('start.safety')); return; }
      var s = C.summarize(recent(7)), iw = C.initialWindow(s, f.mode), t = todayKey();
      data.program = {
        phase: 'active', baselineStart: data.program.baselineStart, start: t, rise: f.rise, mode: f.mode,
        window: iw.window, target: iw.target, wphase: iw.phase, lastReview: t, reviews: [],
        baseline: { avgTST: s.avgTST, avgTIB: s.avgTIB, avgSOL: s.avgSOL, avgWASO: s.avgWASO, se: s.se, n: s.n }
      };
      save(); closeModal(); openModal('week', { week: 1 });
    },
    // Leaves the sleep window: measured time in bed under 6 h marks the check
    // automatically; "something does apply" reopens the safety questions.
    'use-gentle': function (el) {
      var reason = el && el.getAttribute('data-arg');
      data.program = null;
      if (data.check && reason === 'lowTib' && data.check.answers.flags.indexOf('shortTIB') === -1) data.check.answers.flags.push('shortTIB');
      save(); closeModal();
      if (reason === 'lowTib' && data.check) return;
      var prev = data.check ? JSON.parse(JSON.stringify(data.check.answers)) : null;
      ui.check = prev ? { step: 'flags', history: ['main', 'nights', 'duration', 'senior'], answers: prev }
        : { step: 'main', history: [], answers: { main: null, nights: null, duration: null, senior: null, flags: [] } };
      openModal('check');
    },
    'week-open': function (el) { var w = Number(el.getAttribute('data-arg')) || 1; if (ui.modal && ui.modal.name === 'week') { ui.modal.opts.week = w; paintModal(); } else openModal('week', { week: w }); },
    'review-open': function () { openModal('review'); },
    'review-apply': function () { applyReview(false); },
    'review-keep': function () { applyReview(true); },
    'summary-open': function () { if (ui.modal) { ui.modal = { name: 'summary', opts: {} }; paintModal(); } else openModal('summary'); },
    'summary-share': function () {
      var text = summaryText(); if (!text) return;
      if (navigator.share) navigator.share({ title: 'SLEEP_LAB', text: text }).catch(function () { /* cancelled */ });
      else deliverFile('sleeplab-resumen.txt', 'text/plain;charset=utf-8', text, false);
    },

    'cant-open': function () { openModal('cant', { step: 1 }); },
    'cant-step': function (el) { stopShuffle(); stopPacer(); var a = el.getAttribute('data-arg'); ui.modal.opts.step = a === 'b' ? 'b' : Number(a); paintModal(); },
    'pacer-start': function () { var c = document.getElementById('sl-night-tool'); if (c) { stopShuffle(); startPacer(c); } },
    'pacer-stop': function () { stopPacer(); var c = document.getElementById('sl-night-tool'); if (c) c.innerHTML = ''; },
    'shuffle-start': function () { var c = document.getElementById('sl-night-tool'); if (c) { stopPacer(); startShuffle(c); } },
    'shuffle-open': function () {
      if (ui.modal) { ui.modal = { name: 'shuffle', opts: {} }; paintModal(); } else openModal('shuffle');
      startShuffle(null);
    },
    'shuffle-stop': function () { stopShuffle(); },
    'music': function () {
      if (typeof window.startGuidedSession === 'function') window.startGuidedSession('bedtime');
    },
    'breath-lab': function () {
      if (ui.modal) closeModal();
      if (typeof window.showView === 'function') window.showView('tools');
      if (typeof window.setBreathPattern === 'function') window.setBreathPattern('resonance');
      setTimeout(function () { var b = document.getElementById('breath-full'); if (b) b.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
    },

    'closeday-open': function () { if (ui.modal) { ui.modal = { name: 'closeday', opts: {} }; paintModal(); } else openModal('closeday'); },
    'closeday-save': function () {
      data.closeDay = { at: todayKey(), todos: (document.getElementById('sl-todos') || {}).value || '', worries: (document.getElementById('sl-worries') || {}).value || '' };
      data.closeDay = C.sanitizeData({ closeDay: data.closeDay }).closeDay;
      save(); toast(T('saved')); closeModal();
    },

    'export-json': function () {
      deliverFile('sleeplab-respaldo-' + todayKey() + '.json', 'application/json', JSON.stringify({ app: 'SLEEP_LAB', exported: new Date().toISOString(), data: data }, null, 1), true);
    },
    'export-csv': function () { deliverFile('sleeplab-diario-' + todayKey() + '.csv', 'text/csv;charset=utf-8', C.diaryToCSV(data.diary), true); },
    'import': function () { var i = document.getElementById('sl-import-file'); if (i) { i.value = ''; i.click(); } },
    'delete-all': function () {
      if (!window.confirm(T('data.deleteConfirm'))) return;
      data = C.emptyData(); save(); toast(T('data.deleted')); render();
    }
  };

  function updatePreview() {
    var f = ui.form, rise = document.querySelector('[data-sl-time="rise"]'), el = document.getElementById('sl-preview');
    if (rise && C.parseHM(rise.value) !== null) f.rise = rise.value;
    if (!el) return;
    var iw = C.initialWindow(f.summary, f.mode);
    el.innerHTML = T('start.preview', { bed: esc(fmtClock(C.bedtimeFor(f.rise, iw.window))), rise: esc(fmtClock(f.rise)), d: esc(fmtDur(iw.window)) });
  }

  function applyReview(keep) {
    var p = data.program, f = ui.form, t = todayKey();
    if (!p || !f || !f.review) { closeModal(); return; }
    var r = f.review, s = f.summary;
    p.reviews.push({ at: t, n: s ? s.n : 0, consolidated: s ? s.consolidated : 0, from: p.window, to: keep ? p.window : r.window, decision: keep ? 'keep' : r.decision });
    if (!keep) { p.window = r.window; p.wphase = r.phase; }
    p.lastReview = t;
    save(); closeModal();
  }

  // =====================================================================
  // Events
  // =====================================================================
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-sl]');
    if (!el) return;
    var inScope = root.contains(el) || (homeCta && homeCta.contains(el)) || el.closest('#sl-modal');
    if (!inScope) return;
    var fn = ACTIONS[el.getAttribute('data-sl')];
    if (fn) { ev.preventDefault(); fn(el); }
  });
  document.addEventListener('input', function (ev) {
    if (ui.modal && ui.modal.name === 'programStart' && ev.target.matches('[data-sl-time="rise"]')) updatePreview();
  });
  document.addEventListener('change', function (ev) {
    if (ev.target.id !== 'sl-import-file' || !ev.target.files || !ev.target.files[0]) return;
    var reader = new FileReader();
    reader.onload = function () {
      var parsed = null;
      try { parsed = JSON.parse(reader.result); } catch (e) { parsed = null; }
      var raw = parsed && parsed.app === 'SLEEP_LAB' && parsed.data ? parsed.data : null;
      if (!raw) { toast(T('data.importBad')); return; }
      var clean = C.sanitizeData(raw);
      if (!window.confirm(T('data.importConfirm', { n: Object.keys(clean.diary).length }))) return;
      data = clean; save(); toast(T('data.imported')); render();
    };
    reader.readAsText(ev.target.files[0]);
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && ui.modal) closeModal(); });
  document.addEventListener('sleeplab:langchange', function () { render(); if (ui.modal) paintModal(); });
  document.addEventListener('sleeplab:viewchange', function (ev) { if (ev.detail && ev.detail.view === 'sleep') render(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && !ui.modal) render(); });
  window.addEventListener('storage', function (ev) { if (ev.key === STORE_KEY) { data = load(); if (!ui.modal) render(); } });

  function toast(msg) {
    var el = document.getElementById('sl-toast');
    if (!el) {
      el = document.createElement('div'); el.id = 'sl-toast'; el.className = 'sl-toast'; el.setAttribute('role', 'status'); el.setAttribute('data-no-translate', '');
      document.body.appendChild(el);
    }
    el.textContent = msg; el.classList.add('on');
    clearTimeout(ui.toastTimer);
    ui.toastTimer = setTimeout(function () { el.classList.remove('on'); }, 2600);
  }

  // For tests and debugging
  window.SleepApp = { getData: function () { return JSON.parse(JSON.stringify(data)); }, render: render };

  render();
})();
