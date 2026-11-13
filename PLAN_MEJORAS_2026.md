# SLEEP_LAB: plan de mejoras para llevarla a otro nivel

**Fecha:** 12 de noviembre de 2026
**Alcance:** auditoría de las herramientas actuales, comparación con las apps líderes, revisión de la evidencia clínica (con énfasis en 2023–2026), investigadores cuyo trabajo se puede convertir en herramientas, y plan de mejoras por fases.
**Etiquetas de confianza:** [Seguro], [Probable], [Especulando].

**Decisión de producto (13 de noviembre de 2026):** SLEEP_LAB será una herramienta 100 % de autoservicio para cualquier persona, sin médicos ni clínica en su uso. Este documento ya refleja esa decisión: el programa es autoguiado, no hay reportes para médicos ni contenido sobre medicamentos, y la seguridad se resuelve dentro de la app.

---

## 1. Veredicto

Hoy SLEEP_LAB es una máquina de sonidos bien hecha más una enciclopedia. El problema de fondo: **lo que la app hace mejor es lo que menos evidencia tiene, y lo que más evidencia tiene no existe en la app.** [Seguro]

- El meta-análisis más grande sobre qué partes de la terapia de insomnio funcionan (241 ensayos, 31,452 personas) encontró que la educación en higiene del sueño no aporta nada por sí sola y que la relajación tiende a restar. Lo que sí aporta: limitar el tiempo en cama, el control de estímulos y el trabajo con los pensamientos ([Furukawa 2024](https://pubmed.ncbi.nlm.nih.gov/38231522/)).
- La app tiene sonidos, respiración, consejos de higiene y suplementos. No tiene diario de sueño, ni ventana de sueño, ni programa por semanas, ni forma de medir si alguien mejora.

"Otro nivel" no es agregar más sonidos ni más texto. Es convertirla de **sitio de contenido** en **programa que cualquier persona puede seguir sola para dormir mejor**. Mis cinco apuestas, en orden:

1. **Programa autoguiado de 6 semanas con diario y ventana de sueño**, en español, que cualquier persona puede hacer sola. Es la intervención con más evidencia y ninguna app líder la ofrece bien en español.
2. **Regularidad del sueño como la métrica de longevidad de la app.** Predice mortalidad mejor que la duración y se calcula con el diario, sin sensores.
3. **"Mi noche": un planificador personal** (hora de dormir, último café, luz, baño tibio, cena) que reemplaza a la calculadora de ciclos.
4. **Chequeo inicial que elige tu ruta**, en lugar del quiz actual: optimizar, reiniciar o ruta suave.
5. **Limpieza de credibilidad:** quitar péptidos con dosis, cifras inventadas y remedios sin respaldo. En una herramienta que la gente va a usar sin supervisión, lo que se quita vale tanto como lo que se agrega.

Antes de cualquier función nueva hay tres arreglos que no pueden esperar: el bug que deja la página vacía, las afirmaciones de riesgo y las pruebas automatizadas que no están en el repositorio (sección 2.1 y fase 0).

**Qué implica que sea 100 % autoguiado.** Los programas totalmente automatizados sí funcionan: en un ensayo con 1,721 personas, sin terapeuta, el efecto sobre el insomnio fue grande ([Vedaa 2020](https://pubmed.ncbi.nlm.nih.gov/33328044/)). Dos datos obligan a diseñar con cuidado. Solo alrededor de la mitad de los usuarios termina estos programas ([Hwang 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC11903857/)), y la versión entregada solo por app de teléfono no superó de forma significativa a la lista de espera en un meta-análisis en red ([Simon 2023](https://pubmed.ncbi.nlm.nih.gov/36732610/)). Sin una persona que acompañe, la app tiene que hacer tres cosas por sí misma: sostener la constancia con acciones diarias muy pequeñas, usar por defecto la versión suave de la ventana de sueño, y revisar la seguridad antes de ofrecerla (fase 1.5).

---

## 2. Auditoría de lo que ya existe

Revisé el código completo de cada herramienta, todos los textos visibles y la app corriendo en pantalla de teléfono (390 px).

### 2.1 Fallas técnicas verificadas

| # | Falla | Consecuencia | Confianza |
|---|---|---|---|
| 1 | Si la librería de animaciones (GSAP) no carga desde su CDN, todo el contenido queda invisible. El CSS oculta los bloques (`.fade-up { opacity: 0 }`, línea 120) y solo GSAP los muestra (línea 7723). | Página vacía, solo encabezado y menú. Lo reproduje: mi entorno bloquea ese CDN. Le pasa a cualquier usuario cuya red o bloqueador lo impida. La auditoría de septiembre probó que "las vistas funcionan" sin GSAP, pero no que el contenido se viera. | [Seguro] |
| 2 | Las 50 pruebas automatizadas que menciona `SOUND_EVIDENCE_AUDIT.md` no están en el repositorio. | Cada cambio futuro va sin red de seguridad. En un archivo de 8,033 líneas eso garantiza regresiones. | [Seguro] |
| 3 | La app depende de tres servidores externos (cdnjs, Google Fonts) para íconos, tipografías y animaciones. | Carga más lenta, puntos de falla y la causa del bug 1. | [Seguro] |
| 4 | Siempre abre en inglés (`currentLang = 'en'`, línea 4258). No detecta el idioma del teléfono. | En México el primer contacto es en el idioma equivocado. | [Seguro] |
| 5 | Los dos botones flotantes (modo noche e idioma) tapan contenido: el botón "Diagnose Me" y textos de las guías. | Se ve en las capturas a 390 px. | [Seguro] |
| 6 | Todo vive en un solo `index.html` de 590 KB. Las traducciones largas usan un diccionario por fragmento de texto (545 entradas). | Agregar un diario o un programa sobre esta base es frágil. Hay que separar en módulos antes de la fase 1. | [Probable] |
| 7 | El sonido con pantalla bloqueada en iPhone no está probado en dispositivos reales. iOS trata el audio generado en vivo (Web Audio) como "ambiental" y puede cortarlo al bloquear. | La app ya tiene un mecanismo para esquivarlo, pero sigue como pendiente desde septiembre. | [Probable] |
| 8 | No hay analítica de ningún tipo. | No se sabe qué herramientas se usan ni dónde se va la gente. Todo el plan se prioriza a ciegas. | [Seguro] |

### 2.2 Herramienta por herramienta

**Neuro-sintetizador (sonidos).** Es la pieza mejor construida. El motor quedó sólido tras la auditoría de septiembre y el panel "Lo que dice la ciencia" es honesto.

- *Problemas:* quedan textos que contradicen ese mismo panel:
  - "10-15 min: Brain starts synchronizing" y "20+ min: Full entrainment effect" (líneas 1704–1705).
  - "Isochronic tones for strong entrainment" (línea 857).
- No tiene voz. Calm y Headspace viven de sesiones narradas; aquí todo es sonido sin guía.
- No se pueden guardar mezclas propias.
- *Qué haría:* corregir los textos; agregar sesiones narradas en español e inglés como archivos de audio pregrabados, que además son la forma más confiable de sonar con la pantalla bloqueada en iPhone; presentar los sonidos como herramienta de comodidad, no como tratamiento. No agregaría más tipos de sonido: no hay evidencia que lo justifique.

**Laboratorio de respiración.** El patrón por defecto (6 respiraciones por minuto) es el correcto.

- *Problemas:*
  - La sesión está fija en 30 ciclos (5 minutos). El único estudio en insomnio usó 20 minutos antes de dormir (Tsai 2015, ya citado en la app).
  - La guía dice "Lowers cortisol instantly" (línea 2007) y recomienda 4-7-8 "antes de dormir", lo opuesto a las etiquetas de evidencia de la misma pantalla.
  - No hay vibración ni ajuste de ritmo.
- *Qué haría:* selector de duración (5, 10, 20 min), ritmo ajustable entre 5 y 7 por minuto para comodidad, vibración en Android, quitar las afirmaciones, y registrar la sesión en el diario.

**Calculadora de ciclos.** Es la herramienta con peor sustento.

- Asume ciclos fijos de 90 minutos. En 369 personas y 6,064 ciclos medidos en laboratorio la mediana fue 96 minutos, con gran variación entre personas y un primer ciclo más corto ([Cajochen 2024](https://pubmed.ncbi.nlm.nih.gov/37914631/)). La app cita este estudio en su sección de Evidencia y luego hace lo contrario.
- "5 cycles (7.5h) is optimal" no tiene respaldo. No encontramos ningún estudio que valide las calculadoras de ciclos por reloj.
- Ofrece 6 horas como opción válida. Para una herramienta que busca mejorar el sueño es un mal mensaje.
- *Qué haría:* reemplazarla por el planificador "Mi noche" (fase 1).

**Quiz "Diagnose Me".** Es el mayor riesgo de marca de las herramientas.

- Son 2 preguntas, aunque el texto dice 3.
- Con una sola respuesta entrega etiquetas como "Sleep Apnea" o "Restless Leg Syndrome". Se llama "Diagnosis Center".
- Los resultados mandan a protocolos con remedios sin respaldo (tabla 2.3).
- *Qué haría:* reemplazarlo por un "Chequeo de sueño" que orienta y deriva, sin diagnosticar (fase 1).

**Lista "Semana 1" y "Reto de 7 días".** Son texto estático: no se pueden marcar ni guardan nada. Convertirlos en lista interactiva es trivial y alimenta al diario.

**Almacenamiento.** Solo se guarda la configuración de sonido en una clave (`sleepLabSettings`). El service worker tiene código preparado para notificaciones y sincronización de diario, sin uso.

### 2.3 Afirmaciones que hay que corregir o quitar

La sección de Evidencia dice: "All recommendations in SLEEP_LAB are backed by peer-reviewed scientific research". Hoy eso no es cierto. Lo más importante:

| Texto actual | Problema | Qué poner |
|---|---|---|
| Péptidos con dosis: Epitalon, Pinealon, DSIP "forces delta waves", BPC-157 "repairs GABA receptor damage", CJC-1295 "+30% deep sleep", Selank, Semax | Sin ensayos en humanos para sueño. El mejor ensayo de DSIP concluyó que no tiene beneficio terapéutico relevante ([Bes 1992](https://pubmed.ncbi.nlm.nih.gov/1299794/)). Publicar dosis inyectables en una herramienta sin supervisión es el mayor riesgo legal y de reputación de la app. | Quitar la sección completa. |
| Inversión: "Gain 30-40%… 70-85%… 95-99%" | Cifras inventadas. | Quitar la sección. |
| Despertar 3 AM: "Usually Hypoglycemia", miel o aceite MCT, inositol 2–3 g | No encontramos estudios de que bajones de glucosa despierten a personas sin diabetes. El único ensayo de inositol y sueño es en embarazadas ([Mashayekh-Amiri 2022](https://pubmed.ncbi.nlm.nih.gov/32933356/)). | Flujo de control de estímulos (fase 3). |
| Nocturia: "rarely a small bladder… usually cardiac stress", "Salt + Water Hack" | La apnea es una causa entre varias ([Zhou 2020](https://pubmed.ncbi.nlm.nih.gov/31907825/)). Recomendar sal a adultos mayores, muchos con hipertensión, es delicado. | Lista de causas comunes, sin remedios caseros. |
| Cinta en la boca "solo después de descartar apnea" | Revisión de 10 estudios y 213 pacientes: solo 2 mostraron beneficio y hay riesgo de asfixia con obstrucción nasal ([Rhee 2025](https://pubmed.ncbi.nlm.nih.gov/40397877/)). | "No recomendada". |
| "Beta-amyloid plaques are cleared 60% faster during deep sleep"; "only comes out when you sleep deeply" | No existe esa cifra en humanos. En 2024 un estudio en ratones encontró lo contrario: menos limpieza durante el sueño ([Miao 2024](https://pubmed.ncbi.nlm.nih.gov/38741022/)); otro de 2025 defiende el mecanismo ([Hauglund 2025](https://pubmed.ncbi.nlm.nih.gov/39788123/)). Está en debate. | "La falta de sueño parece afectar la limpieza del cerebro; cómo y cuándo ocurre sigue en discusión." |
| "CBT-I has an 80% success rate"; restricción de sueño "works for 80%+" | En los ensayos responde entre 42 % y 67 % según el formato ([Kyle 2023](https://pubmed.ncbi.nlm.nih.gov/37573859/), [Buysse 2011](https://pubmed.ncbi.nlm.nih.gov/21263078/)). | Las cifras reales. |
| Restricción de sueño: mínimo 5 horas | 5 h se usó con enfermera supervisando. El manual pensado para adultos mayores usa 6 h "por seguridad" ([Troxel 2012](https://pubmed.ncbi.nlm.nih.gov/22946736/)). Faltan contraindicaciones: apnea sin tratar, parasomnias, riesgo de caídas, turnos. | Mínimo 6 h y compuerta de seguridad (fase 1). |
| "No caffeine after noon… 3 PM coffee is still 25% active at 9 PM" | Error aritmético: con la vida media de 6 h que la app cita, a las 9 PM queda 50 %. La vida media real va de ~3 a ~10 h según la persona. | Calculadora de último café (fase 1). |
| "Even decaf has 15-30% caffeine" | En otra parte la app dice 15–30 mg. Lo medido: 0–13.9 mg por porción de 16 oz (McCusker 2006). | Corregir. |
| "18-20°C… non-negotiable" | Adultos mayores durmieron mejor entre 20 y 25 °C, con mucha variación individual ([Baniassadi 2023](https://pubmed.ncbi.nlm.nih.gov/37474050/)). | "Fresco pero cómodo; evita más de 25 °C." |
| "10 minutes of sunlight… 16-hour countdown"; "≥2,000 lux"; "through a window = 50% less" | Ningún ensayo prueba "10 minutos". No hay umbral fijo ni fuente para el 50 %. | "Sal a la luz del día por la mañana y lo más que puedas durante el día." |
| Lentes TrueDark "essential"; "Zero screens" por la luz azul | Cochrane: evidencia inconsistente y de muy baja certeza para los lentes ([Singh 2023](https://pubmed.ncbi.nlm.nih.gov/37593770/)). El efecto de las pantallas en la latencia es pequeño; pesa más que desplazan el sueño y activan ([Bauducco 2024](https://pubmed.ncbi.nlm.nih.gov/38657359/)). | Quitar marca; "baja las luces 3 h antes". |
| Eight Sleep "+20% deep sleep proven", "gold standard", "non-negotiable" | El estudio del fabricante halló +14 min solo en hombres ([Moyen 2024](https://pubmed.ncbi.nlm.nih.gov/38671774/)); el independiente, mejoría percibida sin cambio objetivo ([Stevenson 2025](https://pubmed.ncbi.nlm.nih.gov/41133665/)). | Suavizar. |
| Sensate "+45-60 min sleep/night (study)"; Hapbee; PEMF; EMF y sábanas de tierra | Sin ensayos publicados localizables. | Quitar. |
| Magnesio "Essential… 400mg" | Revisión de 2026, 12 ensayos: no respalda su uso rutinario; certeza baja a muy baja ([Lopresti 2026](https://pubmed.ncbi.nlm.nih.gov/42661485/)). | Etiqueta "evidencia débil". |
| PharmaGABA "cuts sleep latency in half"; Honokiol "comparable to benzodiazepines"; valeriana; CBD; marca Life Extension | GABA: evidencia muy limitada ([Hepsomali 2020](https://pubmed.ncbi.nlm.nih.gov/33041752/)). Valeriana: sin evidencia de eficacia ([Valente 2024](https://pubmed.ncbi.nlm.nih.gov/38359657/)). CBD solo: sin efecto ([da Silva 2025](https://pubmed.ncbi.nlm.nih.gov/40929927/)). | Insignia de evidencia y advertencias en cada tarjeta. |
| Sofocos: "Eight Sleep… non-negotiable", "Vitamin E clinically shown" | Lo que tiene evidencia fuerte es la terapia conductual ([McCurry 2016](https://pubmed.ncbi.nlm.nih.gov/27213646/)). | Módulo de menopausia (fase 4). |
| Mito "Catch up later: FALSE" | El consenso de la NSF dice que recuperar un poco el fin de semana puede ayudar ([Sletten 2023](https://pubmed.ncbi.nlm.nih.gov/37684151/)). | Matizar. |
| "Track with Oura/Whoop/Apple Watch" para sueño profundo y REM | Los relojes aciertan dormido/despierto (≥95 %), pero las fases solo 50–86 % ([Robbins 2024](https://pubmed.ncbi.nlm.nih.gov/39460013/)). | "Sirven para duración y regularidad, no para minutos por fase." |
| Cronotipos león/oso/lobo/delfín | No encontramos ninguna validación publicada. | Escala continua (fase 2). |
| "Cited in Peer-Reviewed Journals: Science, Nature…" | Sugiere que esas revistas citan a la app. | "Fuentes:". |

### 2.4 Estructura y negocio

- La vista Aprender mide unos 19,000 px en un teléfono: alrededor de 22 pantallas de scroll. Los ensayos sugieren que los módulos largos de teoría no ayudan e incluso pueden empeorar la latencia ([Steinmetz 2024](https://pubmed.ncbi.nlm.nih.gov/39504928/)).
- No hay datos estructurados para Google, y la fecha de revisión de la evidencia solo aparece en el panel de sonidos.
- La sección "The Architects" lista divulgadores (Walker, Huberman, Attia, Breus, Asprey). Los investigadores cuyos estudios sostienen la app no aparecen (sección 4).

---

## 3. Qué hacen las mejores apps y dónde está el hueco

### Lo que comparten las líderes y SLEEP_LAB no tiene

Ordenado por fuerza de la evidencia.

| Mecánica | Evidencia de que mejora el sueño | Quién la tiene |
|---|---|---|
| Diario → eficiencia → ventana de sueño personal, con reglas de control de estímulos | La más fuerte (sección 4). Además, el diario fue la función más pedida: 88 % en una encuesta ([Aji 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6707571/)). | SleepioRx, Somryst, CBT-i Coach, Stellar Sleep, Sleep Reset, Rest |
| Programa de 4 a 9 semanas con avance semanal | 29 ensayos, 9,475 personas: efecto moderado a grande, sostenido ([Hwang 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC11903857/)). | Las mismas |
| Herramientas cognitivas | Componente con mayor efecto individual en Furukawa 2024. | Sleepio, Somryst, Headspace |
| Medición de progreso | Estándar en todos los ensayos. | Todas |
| Llevarse y compartir los propios datos | 70 % de los usuarios lo quiere (Aji 2019). | Pocas |
| Recordatorios | Solo ayuda a la constancia. | Todas |
| Sincronizar relojes y anillos | Mixta; puede dañar (sección 7). | Rastreadores |
| Puntaje de sueño y rachas | Ninguna; posible daño. | Rastreadores |

### El hueco que SLEEP_LAB puede ocupar

- **Español.** Sleepio, Somryst, CBT-i Coach, Insomnia Coach, Stellar Sleep y Sleep Reset aparecen solo en inglés en la App Store de EE. UU. La única recién llegada que anuncia español es Rest, solo para iPhone. [Probable; revisado en listados de noviembre de 2026]
- **Adultos mayores.** El tratamiento breve conductual se diseñó para ellos y nadie lo ofrece bien en una app.
- **Gratis y sin cuenta.** Los programas comerciales cuestan del orden de 190 a 300 dólares al mes [dato reportado por competidores, sin verificar]. La opción gratuita del gobierno de EE. UU. (Insomnia Coach) tiene 3.7 estrellas y se actualizó por última vez en junio de 2025.
- **Transparencia.** Solo un tercio de las apps de sueño contiene evidencia empírica ([Lee-Tobin 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5656485/)). SLEEP_LAB ya tiene insignias de evidencia en los sonidos; extenderlas a todo es su firma.
- **Autoservicio completo.** Sin cuenta, sin suscripción y sin depender de nadie para avanzar.

---

## 4. De los investigadores a las herramientas

Estos son los investigadores cuyos estudios se pueden convertir en algo que la app haga, no solo en algo que diga.

| Investigador | Estudio | Qué encontró | En qué se convierte |
|---|---|---|---|
| Simon Kyle (Oxford) | [HABIT, Lancet 2023](https://pubmed.ncbi.nlm.nih.gov/37573859/) | 642 adultos de 19 a 88 años. Cuatro sesiones breves de enfermería para limitar el tiempo en cama: menos insomnio a 6 meses (d −0.74); respondió 42 % contra 17 % con solo consejos. | Ventana de sueño |
| Daniel Buysse y Wendy Troxel (Pittsburgh) | [BBTI 2011](https://pubmed.ncbi.nlm.nih.gov/21263078/), [manual 2012](https://pubmed.ncbi.nlm.nih.gov/22946736/) | 79 personas, edad media 72. Dos visitas y dos llamadas: respondió 67 % contra 25 %. | Reglas y ritmo del programa |
| Øystein Vedaa (Noruega) | [Programa automatizado, 2020](https://pubmed.ncbi.nlm.nih.gov/33328044/) | 1,721 personas, sin terapeuta: efecto grande sobre el insomnio. Cerca de un tercio no completó la evaluación final. | Programa 100 % autoguiado |
| Yuki Furukawa y Michael Perlis | [Componentes, 2024](https://pubmed.ncbi.nlm.nih.gov/38231522/) | Sirven: ventana de sueño, control de estímulos, trabajo cognitivo. No sirven solos: higiene y relajación. | El orden del programa |
| Lisa Steinmetz, Dieter Riemann (Friburgo) | [Componentes, 2024](https://pubmed.ncbi.nlm.nih.gov/39504928/) | 80 estudios: la restricción y el control de estímulos son los componentes más eficaces. | Diario siempre con una acción |
| Susanna Jernelöv (Karolinska) | [Compresión vs. restricción, 2025](https://pubmed.ncbi.nlm.nih.gov/40205789/) | 234 personas. Reducir poco a poco funciona algo menos, pero con mejor adherencia y menos efectos secundarios. | "Modo suave", por defecto a partir de 65 años |
| Rachel Manber (Stanford) | [Triage y atención escalonada, 2025](https://pubmed.ncbi.nlm.nih.gov/39115347/) | Una lista de triage más atención escalonada superó a lo digital solo. | Chequeo inicial que elige la ruta |
| Colleen Carney | [Diario de consenso, 2012](https://pubmed.ncbi.nlm.nih.gov/22294820/) | Estandariza qué preguntar cada mañana. | Diario de sueño |
| Colin Espie (Oxford) | [Escala de esfuerzo por dormir, 2005](https://pubmed.ncbi.nlm.nih.gov/16364141/) | Esforzarse por dormir perpetúa el insomnio. | Tarjeta "deja de intentarlo" |
| Markus Jansson-Fröjmark | [Control de estímulos, 2024](https://pubmed.ncbi.nlm.nih.gov/37496454/); [intención paradójica, 2022](https://pubmed.ncbi.nlm.nih.gov/34405469/) | Ambos funcionan frente a controles pasivos. | Flujo interactivo que reemplaza al protocolo 3 AM |
| Allison Harvey (Berkeley) | [Conductual vs. cognitiva, 2014](https://pubmed.ncbi.nlm.nih.gov/24865869/) | Lo conductual actúa rápido; lo cognitivo tarda más y dura más. | Conducta en semanas 1–2, pensamientos en 3–4 |
| Michael Scullin (Baylor) | [Lista de pendientes, 2018](https://pubmed.ncbi.nlm.nih.gov/29058942/) | 57 adultos jóvenes, una noche en laboratorio: escribir 5 minutos los pendientes de mañana acortó el tiempo para dormirse. Evidencia débil, riesgo nulo. | Tarjeta "Cierra el día" |
| Luc Beaudoin (Simon Fraser) | Barajado cognitivo (resumen de congreso, 2016) | Imaginar palabras al azar. Solo un resumen sin grupo control. | Reproductor de palabras, etiquetado "poco probado" |
| Jason Ong | [Mindfulness para insomnio, 2014](https://pubmed.ncbi.nlm.nih.gov/25142566/) | 54 personas; 50 % en remisión a 6 meses. Otros análisis no lo ven mejor que controles activos. | Serie breve de práctica diurna |
| Barry Krakow | [Ensayo de imágenes, JAMA 2001](https://pubmed.ncbi.nlm.nih.gov/11476655/) | 168 personas: menos noches con pesadillas (d = 1.24). | Hoja de trabajo para pesadillas |
| Andrew Phillips, Daniel Windred, Sean Cain (Monash) | [Regularidad y mortalidad, 2024](https://pubmed.ncbi.nlm.nih.gov/37738616/); [luz y mortalidad, 2024](https://pubmed.ncbi.nlm.nih.gov/39405349/) | 60,977 personas: dormir a horas regulares se asoció con 20–48 % menos mortalidad y predijo mejor que la duración. 88,905 personas: días luminosos y noches oscuras, menor mortalidad. | Índice de regularidad; plan de luz |
| Till Roenneberg (Múnich) | [Jet lag social](https://pubmed.ncbi.nlm.nih.gov/31336976/) | Diferencia entre el horario de días libres y laborales. | Lectura de jet lag social; escala de cronotipo |
| Timothy Brown y consenso internacional | [Luz recomendada, 2022](https://pubmed.ncbi.nlm.nih.gov/35298459/) | Mucha luz de día, tenue 3 h antes de dormir, oscuridad al dormir. | Plan de luz |
| Phyllis Zee (Northwestern) | [Luz al dormir, 2022](https://pubmed.ncbi.nlm.nih.gov/35286195/) | Una noche con luz moderada elevó el pulso y la resistencia a la insulina a la mañana siguiente. | Revisión de oscuridad de la recámara |
| Kenneth Wright (Colorado) | [Estudios de campamento, 2013](https://pubmed.ncbi.nlm.nih.gov/23910656/) | Una semana de luz natural adelanta el reloj biológico. | Reto "fin de semana de reinicio" |
| Carissa Gardiner y Shona Halson | [Cafeína, 2023](https://pubmed.ncbi.nlm.nih.gov/36870101/); [ensayo, 2025](https://pubmed.ncbi.nlm.nih.gov/39377163/); [alcohol, 2025](https://pubmed.ncbi.nlm.nih.gov/39631226/) | Un café (107 mg) debe tomarse al menos 8.8 h antes de dormir; 217 mg, 13.2 h. El alcohol reduce el REM desde unas dos copas. | Calculadora de último café |
| Shahab Haghayegh | [Baño tibio, 2019](https://pubmed.ncbi.nlm.nih.gov/31102877/) | 40–42.5 °C, 1–2 h antes de dormir, al menos 10 minutos. | Temporizador de baño |
| Amir Baniassadi (Harvard) | [Temperatura en adultos mayores, 2023](https://pubmed.ncbi.nlm.nih.gov/37474050/) | Mejor sueño entre 20 y 25 °C. | Tarjeta térmica por edad |
| Christian Cajochen (Basilea) | [Ciclos de sueño, 2024](https://pubmed.ncbi.nlm.nih.gov/37914631/) | Los ciclos no duran 90 minutos fijos. | Retirar la calculadora de ciclos |
| Charmane Eastman y Helen Burgess | [Viajar sin jet lag, 2009](https://pubmed.ncbi.nlm.nih.gov/20204161/) | Reglas de luz por día según zonas horarias. | Planificador de jet lag |
| Kelly Baron; Dimitri Gavriloff | [Ortosomnia, 2017](https://pubmed.ncbi.nlm.nih.gov/27855740/); [retroalimentación falsa, 2018](https://pubmed.ncbi.nlm.nih.gov/29989248/) | Decirle a alguien que durmió mal empeora cómo se siente al día siguiente. | Ningún puntaje nocturno |
| Susan McCurry; Christopher Drake | [Menopausia, 2016](https://pubmed.ncbi.nlm.nih.gov/27213646/); [2019](https://pubmed.ncbi.nlm.nih.gov/30481333/) | La terapia conductual redujo el insomnio en mujeres con sofocos. | Entrada de menopausia al mismo programa |
| Jason Ellis | [Insomnio reciente, 2015](https://pubmed.ncbi.nlm.nih.gov/25515106/) | 40 personas: una sola sesión dio 60 % de remisión contra 15 %. | Plan de una pantalla para insomnio de menos de 3 meses |

---

## 5. Lo nuevo (2024–2026) que la app debe reflejar

**Longevidad**
- La regularidad compite con la duración como predictor de mortalidad, eventos cardiovasculares ([Chaput 2025](https://pubmed.ncbi.nlm.nih.gov/39603689/)) y demencia ([Yiallourou 2024](https://pubmed.ncbi.nlm.nih.gov/38165323/)). Todo es observacional: ningún ensayo demuestra que regularizar el sueño alargue la vida. La app debe decir "se asocia con", no "previene".
- La Comisión Lancet de demencia 2024 no incluyó el sueño entre sus 14 factores de riesgo modificables por evidencia insuficiente ([Livingston 2024](https://pubmed.ncbi.nlm.nih.gov/39096926/)), y un consorcio de 5,471 personas no encontró medidas de sueño que predijeran demencia ([Yiallourou 2026](https://pubmed.ncbi.nlm.nih.gov/42525904/)). El texto "previene el Alzheimer" debe moderarse.
- La Asociación Americana del Corazón define la salud del sueño en varias dimensiones: duración, continuidad, horario, regularidad, funcionamiento diurno y ausencia de trastornos ([St-Onge 2025](https://pubmed.ncbi.nlm.nih.gov/40223596/)). Sirve como marco para reorganizar los "pilares".

**Fuera del alcance por decisión de producto**
- Los avances en medicamentos (tirzepatida para apnea, agonistas de orexina, fármacos para sofocos, nuevas guías de piernas inquietas) no entran en una herramienta de autoayuda. La app no los cubre.
- Sí conviene un dato para quien usa reloj: las alertas de apnea no la descartan. La de Apple detectó alrededor de dos de cada tres casos moderados a graves según su expediente ante la FDA [dato leído en el documento de la FDA por la investigación; no lo reabrí].

**Suplementos**
- Melatonina: el efecto es mayor cerca de 4 mg y tomada unas 3 horas antes de dormir ([Cruz-Sanabria 2024](https://pubmed.ncbi.nlm.nih.gov/38888087/)). Hay una señal observacional de 2025 entre uso prolongado e insuficiencia cardiaca, presentada en congreso y sin revisión por pares. La guía europea no recomienda la de liberación rápida para insomnio ([Riemann 2023](https://pubmed.ncbi.nlm.nih.gov/38016484/)). Esto contradice la tarjeta "0.3–1 mg" de la app. Sin revisión médica, la app debe mostrar lo que dice la evidencia y no recomendar una dosis.
- Ashwagandha: 25 casos de daño hepático reportados ([McIntyre 2026](https://pubmed.ncbi.nlm.nih.gov/42367407/)). Falta la advertencia.

**Tecnología**
- No encontramos ningún ensayo de que un coach de IA mejore el sueño de pacientes; solo pruebas de examen ([Khasentino 2025](https://pubmed.ncbi.nlm.nih.gov/40813712/)).

---

## 6. El plan por fases

Los tamaños son estimados [Especulando]: **S** = una sesión de trabajo con Claude Code, **M** = varias sesiones, **L** = proyecto de semanas.

### Fase 0. Saneamiento (primero, antes de todo)

| # | Mejora | Por qué | Tamaño |
|---|---|---|---|
| 0.1 | Contenido visible por defecto; la animación solo se activa si GSAP cargó. Alojar GSAP, íconos y tipografías en el propio sitio. | Elimina la página vacía y la dependencia de terceros. | S |
| 0.2 | Recrear y guardar las pruebas automatizadas, y correrlas en cada cambio (GitHub Actions). | Sin esto, cada fase siguiente rompe algo de la anterior. | M |
| 0.3 | Aplicar la tabla 2.3: quitar péptidos, tratamientos clínicos (cámara hiperbárica, sueros de NAD+, células madre), cifras de inversión y remedios sin respaldo; corregir las contradicciones internas. | Riesgo legal y de credibilidad. | M |
| 0.4 | Insignia de evidencia y advertencias en cada suplemento, con el mismo sistema que ya usan los sonidos. | Convierte la sección más débil en un diferenciador. | M |
| 0.5 | Detectar el idioma del teléfono; mover los botones flotantes. | Primer contacto correcto. | S |
| 0.6 | Renombrar "Diagnose Me / Diagnosis Center" y poner el aviso "esto no es un diagnóstico" junto a las herramientas, no solo al pie. | Riesgo regulatorio. | S |
| 0.7 | Fecha de revisión de la evidencia y fuente visible en cada herramienta y cada tarjeta. | Confianza y posicionamiento en Google. | S |
| 0.8 | Analítica sin cookies (por ejemplo, la de Vercel). | Decidir con datos qué se usa. | S |
| 0.9 | Separar el archivo único en módulos y pasar los textos nuevos a un sistema de traducción por claves. | Base para construir el diario sin romper lo demás. | M |

### Fase 1. Núcleo: diario, chequeo, "Mi noche" y programa

**1.1 Diario de sueño (M).** Un registro de un minuto cada mañana, con botones grandes: a qué hora te acostaste, cuánto tardaste en dormirte, cuántas veces despertaste y cuánto tiempo, a qué hora despertaste y te levantaste, siestas. La app calcula tiempo dormido, tiempo en cama y eficiencia, y muestra **promedios semanales, nunca una calificación por noche**. Solo deja capturar hoy y los dos días anteriores, como hacen los programas clínicos. Dos reglas de diseño que vienen de los ensayos: desde la segunda semana el diario siempre va acompañado de una acción, porque un diario sin intervención se comporta como nocebo (Steinmetz 2024); y se le pide a la persona estimar, no mirar el reloj.

**1.2 Regularidad (S, encima del diario).** Con 14 noches la app dibuja una franja por día con las horas dormidas y calcula el índice de regularidad del sueño (la probabilidad de estar en el mismo estado, dormido o despierto, a la misma hora del día siguiente; [Phillips 2017](https://pubmed.ncbi.nlm.nih.gov/28607474/)), la variación de la hora de dormir y el jet lag social. Muestra tendencia y una sola acción: fijar la hora de levantarse. No pone etiquetas de riesgo, porque los umbrales de los estudios con acelerómetro no se trasladan a un diario.

**1.3 Chequeo inicial (M).** Reemplaza al quiz. Son dos minutos de preguntas propias, sin cuestionarios con licencia. No diagnostica: elige una ruta.

- **Optimizar:** para quien duerme razonablemente bien. Regularidad, "Mi noche" y plan de luz. Sin ventana de sueño.
- **Reiniciar:** para quien tarda en dormirse o se despierta de noche. Programa autoguiado de 6 semanas. Si el problema tiene menos de 3 meses, empieza con un plan breve de una pantalla (Ellis 2015).
- **Ruta suave:** para quien no pasa el autochequeo de seguridad de 1.5. Horario fijo, control de estímulos y herramientas para la mente, sin recortar tiempo en cama.

Cuando las respuestas apuntan a algo que una app no resuelve (ronquido fuerte con pausas al respirar, quedarse dormido al manejar, o los cinco criterios de piernas inquietas de [Allen 2014](https://pubmed.ncbi.nlm.nih.gov/25023924/)), la app lo dice en una sola línea y sigue ofreciendo la ruta suave. No deriva, no agenda y no depende de nadie.

**1.4 "Mi noche" (M).** Reemplaza a la calculadora de ciclos. Con la hora de levantarse, la edad y lo que la persona suele tardar en dormirse, arma una línea de tiempo de la tarde:

- Hora de acostarse: levantarse menos 7–9 h (7–8 h a partir de 65 años, [Hirshkowitz 2015](https://pubmed.ncbi.nlm.nih.gov/29073412/)) menos la latencia. La misma hora de levantarse todos los días.
- Último café: según dosis y hora de dormir (8.8 h para un café; más para dosis mayores), con ajuste por tabaquismo, anticonceptivos y embarazo.
- Bajar las luces 3 h antes; baño tibio 1–2 h antes; ejercicio intenso hasta 4 h antes ([Leota 2025](https://pubmed.ncbi.nlm.nih.gov/40234380/)); cena unas 3 h antes, marcada como evidencia débil.
- Botón "agregar a mi calendario" para que el teléfono avise. Es la forma de tener recordatorios sin servidor (sección 8).

**1.5 Programa autoguiado "Reinicio de 6 semanas" (L).** El centro del plan. Toma las reglas del tratamiento breve conductual y el formato de los programas automatizados, que duran de 6 a 9 semanas.

1. **Semana 0:** siete noches de diario como línea base.
2. **Autochequeo de seguridad.** Unas pocas preguntas de sí o no. La ventana de sueño no se ofrece, y la persona pasa a la ruta suave, si hay: trastorno bipolar, epilepsia, psicosis, ideas suicidas, embarazo, señales de apnea sin tratar, sonambulismo u otras parasomnias, trabajo por turnos, manejo profesional o trabajo de riesgo, caídas o fragilidad, o si la persona ya pasa menos de 6 horas en cama. Estas exclusiones vienen del ensayo HABIT, del manual BBTI y de las instrucciones de Somryst.
3. **Ventana de sueño.** Tiempo dormido promedio + 30 minutos, nunca menos de 6 horas. La persona elige la hora de levantarse; la app calcula la de acostarse.
4. **Revisión semanal.** Si la mayoría de las noches tardó menos de 30 minutos en dormirse y estuvo despierta menos de 30 minutos, se suman 15 minutos; si no, se restan 15, sin bajar de 6 horas (regla del manual BBTI).
5. **Versión suave por defecto para todos:** reducir el tiempo en cama poco a poco, 15 a 30 minutos por semana, en lugar de un recorte inicial. Es algo más lenta, pero tiene mejor adherencia y menos efectos secundarios (Jernelöv 2025), que es lo que importa cuando nadie acompaña. La versión rápida queda como opción para quien la elija.
6. **Cuatro reglas** siempre visibles: menos tiempo en cama, misma hora de levantarse, a la cama solo con sueño, fuera de la cama si no duermes.
7. **Semanas 3 a 5:** herramientas para los pensamientos (fase 3). **Semana 6:** plan para recaídas.
8. **Aviso de somnolencia** las tres primeras semanas, con advertencia expresa sobre manejar ([Kyle 2014](https://pubmed.ncbi.nlm.nih.gov/24497651/)).
9. **Cierre:** resumen personal de las 6 semanas, exportable.

Para sostener la constancia sin una persona detrás: registro de un minuto, una sola acción por semana, recordatorios en el calendario del teléfono y rachas por llenar el diario, nunca por "dormir bien".

### Fase 2. El día y el reloj biológico

| # | Mejora | Evidencia | Tamaño |
|---|---|---|---|
| 2.1 | Plan de luz: metas de luz de día y de oscuridad, registro de minutos al aire libre, revisión de la recámara. | Moderada (consenso 2022; cohortes 2024) | S |
| 2.2 | Temporizador de siesta de 25–30 minutos, con aviso si las siestas pasan de una hora o van en aumento. | Moderada ([Brooks 2006](https://pubmed.ncbi.nlm.nih.gov/16796222/), [Yamada 2015](https://pubmed.ncbi.nlm.nih.gov/26158892/)) | S |
| 2.3 | Tarjeta térmica por edad y temporizador de baño tibio. | Moderada | S |
| 2.4 | Escala de cronotipo continua calculada del diario, que reemplaza a los animales. | Moderada ([Fischer 2017](https://pubmed.ncbi.nlm.nih.gov/28636610/)) | S |
| 2.5 | Plan de movimiento: caminar, yoga o tai chi. | Moderada a débil ([Bu 2026](https://pubmed.ncbi.nlm.nih.gov/40664502/)) | S |
| 2.6 | Planificador de jet lag con tarjetas diarias "busca luz / evita luz / duerme". Útil para quien viaja con frecuencia. | Moderada (reglas de expertos sobre datos de laboratorio) | L |
| 2.7 | Ayuda para turno nocturno. | Moderada ([Smith 2009](https://pubmed.ncbi.nlm.nih.gov/19928387/)) | M |

### Fase 3. Herramientas para la mente y audio guiado

| # | Mejora | Evidencia | Tamaño |
|---|---|---|---|
| 3.1 | Flujo interactivo "No puedo dormir": levántate tras 15–20 minutos, actividades tranquilas, vuelve con sueño. Para adultos mayores: "siéntate con luz tenue; no camines a oscuras". Reemplaza al protocolo 3 AM. | Moderada | M |
| 3.2 | "Cierra el día": cinco minutos para anotar preocupaciones con su siguiente paso y los pendientes concretos de mañana. | Débil, riesgo nulo ([Carney 2006](https://pubmed.ncbi.nlm.nih.gov/16390282/), Scullin 2018) | S |
| 3.3 | Tarjetas de creencias sobre el sueño y tarjeta "deja de intentarlo". | Moderada | M |
| 3.4 | Reproductor de barajado cognitivo: una palabra cada 8 segundos, con desvanecido. Usa el motor de sonido que ya existe. | Débil; etiquetado como tal | S |
| 3.5 | Sesiones narradas en español e inglés como audio pregrabado: rutina de noche, respiración guiada, práctica de atención plena de día. | Comodidad, no tratamiento | M |
| 3.6 | Mejoras al laboratorio de respiración (sección 2.2). | Moderada para variabilidad cardiaca | S |
| 3.7 | Hoja de trabajo para pesadillas, con aviso de que no es para pesadillas por trauma. | Fuerte en pesadillas por trauma; débil en autoayuda | S |

### Fase 4. Profundidad

| # | Mejora | Por qué | Tamaño |
|---|---|---|---|
| 4.1 | "Mis datos": resumen personal, respaldo y exportación del diario. | Es el primer dato de la app que duele perder (sección 8), y 70 % de los usuarios quiere poder llevarse sus datos. | M |
| 4.2 | Entrada de menopausia al mismo programa. | Evidencia fuerte para terapia conductual. | M |
| 4.3 | Página "Qué miden bien y mal los relojes". | Sección 5. | S |
| 4.4 | Reemplazar "The Architects" por los investigadores de la sección 4, con su estudio y la herramienta que inspira. | Coherencia con la marca de evidencia. | S |
| 4.5 | Entrada manual de datos de reloj o anillo (duración y horas), sin fases. | Aprovecha lo que los relojes miden bien. | S |

---

## 7. Lo que no recomiendo construir

- **Puntaje de sueño por noche y rachas de "buen sueño".** No hay evidencia de beneficio y sí de daño: la retroalimentación negativa empeora el día siguiente (Gavriloff 2018) y existe la obsesión por los datos del sueño, la ortosomnia (Baron 2017). Rachas de *llenar el diario*, sí.
- **Medir el sueño con el micrófono o el acelerómetro del teléfono.** Una web app no puede: ambos se detienen al bloquear la pantalla. Y aunque pudiera, las apps de teléfono coinciden mal con el estudio de sueño de laboratorio.
- **Alarma inteligente por fases.** No encontramos ningún ensayo que muestre que reduce el aturdimiento.
- **Coach con IA generativa.** Sin ensayos con pacientes, requiere servidor y te pone a responder por lo que diga un modelo sobre salud.
- **Contenido sobre medicamentos, péptidos y tratamientos clínicos.** Fuera del alcance de una herramienta de autoayuda, y es el contenido con más riesgo.
- **Sincronización automática con relojes, por ahora.** Apple Health no tiene acceso web; Fitbit cambió de API en noviembre de 2026; Whoop exige servidor. Mucho trabajo para datos que no cambian la intervención.
- **Más sonidos, más tonos, más frecuencias.** La app ya está en el techo de lo que la evidencia de sonido permite.
- **Entrenamiento intensivo de sueño, parejas, y relajación presentada como cura.** Sin evidencia utilizable.

---

## 8. Límites técnicos de una web app y cómo los esquivo

| Capacidad | Situación en 2026 | Qué hacer |
|---|---|---|
| Recordatorios programados | No existen para web apps sin servidor. Las notificaciones push requieren un servidor, y en iPhone solo funcionan con la app instalada en la pantalla de inicio. | Exportar los horarios al calendario del teléfono [idea sin probar aún]. |
| Sonido con pantalla bloqueada en iPhone | El audio generado en vivo puede cortarse; los archivos de audio sí siguen sonando. | Sesiones narradas pregrabadas; probar en dispositivos reales. |
| Guardado de datos | Safari puede borrar los datos de un sitio tras 7 días sin uso si la app no está instalada. | Pedir instalación, solicitar almacenamiento persistente y ofrecer respaldo exportable desde el primer día del diario. |
| Compartir archivos | Funciona en iPhone y Android. | Exportar el resumen y el respaldo. |
| Vibración y Bluetooth | Solo Android. | Vibración en respiración; nada que dependa de Bluetooth. |
| Medir luz ambiente | No disponible. | El plan de luz es guía, no medición. |

El diario es el primer dato de la app que duele perder. Mientras no haya servidor, el respaldo exportable no es opcional. [Seguro]

---

## 9. Decisiones

**Ya decidido (13 de noviembre de 2026):** la app es 100 % de autoservicio, sin médicos ni clínica en su uso. Lo que eso cambia:

1. **El contenido tiene que ser más conservador, no menos.** Sin revisión médica salen completos los péptidos, los tratamientos clínicos y las combinaciones de suplementos con dosis. Los suplementos quedan como tabla informativa con su nivel de evidencia.
2. **La ventana de sueño usa la versión suave por defecto** y un mínimo de 6 horas.
3. **Los cuestionarios clínicos con licencia ya no hacen falta.** El chequeo usa preguntas propias y las métricas salen del diario.

**Un punto en el que mantengo mi posición.** El autochequeo de seguridad y la línea de aviso del chequeo inicial se quedan, aunque no haya ningún médico en el producto. Recortar el tiempo en cama produce somnolencia real las primeras semanas (Kyle 2014). Sin ese filtro, la app le daría la misma instrucción a alguien con apnea sin tratar que maneja todos los días. No es involucrar a un médico: es que la herramienta no dañe a quien más confía en ella. [Seguro]

**Pendientes tuyos:**

1. **Con o sin servidor.** Recomiendo seguir sin servidor: es más barato, más privado y suficiente para todo lo de este plan. [Probable]
2. **Lenguaje.** "Herramienta educativa de autoayuda", nunca "diagnostica" o "trata". Dónde queda exactamente la línea regulatoria en México no lo verifiqué. [Especulando]
3. **La marca.** La app se llama "by Cabo Health". Si no debe tener relación con la parte médica, decide si conserva ese nombre.

---

## 10. Cómo se verificó y qué queda pendiente

- **Auditoría de la app:** lectura del código y de todos los textos, y ejecución en Chromium con pantalla de 390 px. La página vacía sin GSAP está reproducida; los números de línea corresponden al `index.html` del commit `d2e9814`.
- **Evidencia:** cuatro pasadas de investigación independientes abrieron las fuentes. Además comprobé por mi cuenta, contra el registro oficial de PubMed, el título, primer autor, revista y año de 119 estudios de esas pasadas: los 119 coinciden, y los 76 enlaces a PubMed de este documento están todos entre ellos. Leí completo el abstract de 10 (Furukawa, HABIT, Windred, Gardiner, Cajochen, Rhee, Baniassadi, Steinmetz, Jernelöv, Lopresti) y los números coinciden.
- **Sin verificar o con verificación parcial:**
  - Precios de apps comerciales y varios datos regulatorios de relojes y anillos (reportados por terceros).
  - Los umbrales exactos de ajuste del ensayo HABIT (están en su apéndice).
  - La existencia de versiones validadas en español de varias escalas menores.
  - Las cifras de sensibilidad de las alertas de apnea, que la investigación leyó en el expediente de la FDA y yo no reabrí.
  - Los estudios enlazados a PubMed Central (Hwang 2025, Aji 2019, Lee-Tobin 2017): leídos por la investigación, no recomprobados por mí.
- **Lo que la app no es:** atención médica. No la sustituye ni depende de ella, y lo dice en una línea.
