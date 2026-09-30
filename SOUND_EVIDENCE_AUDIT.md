# Auditoría del Laboratorio Neuro-Acústico: bugs, evidencia y mejoras

**Fecha:** 30 de septiembre de 2026
**Alcance:** motor de sonido (sintetizador, ruido, respiración), textos científicos de la app, citas, service worker y bugs generales.
**Cómo se verificó:** pruebas automatizadas en Chromium headless (Playwright), análisis de audio renderizado con `OfflineAudioContext` y revisión de literatura con los papers abiertos en PubMed/PMC.

---

## 1. Resumen ejecutivo

1. **El motor de sonido tenía bugs serios de funcionamiento**, no solo cosméticos:
   - En ciertos casos, Play no sonaba.
   - Una sesión nueva podía quedar en silencio aunque la pantalla dijera "sonando".
   - El ruido no podía reproducirse solo.
   - El "ruido rosa" en realidad era ruido café.
   - Había un click cada 2 segundos.
   - El ruido sonaba ~34 dB por debajo de los tonos, así que era prácticamente inaudible.
2. **Varias afirmaciones científicas estaban sobredimensionadas.** Ejemplos:
   - "Efecto más fuerte" en los tonos isocrónicos.
   - "El ruido rosa aumenta el sueño profundo".
   - "Ruido café para TDAH/ansiedad".
   - "Entrainment completo a los 20 min".
3. **4 de las 6 citas revisadas en la sección de Evidencia apuntaban a papers equivocados.** Por ejemplo, un PMC sobre detección de frutas y otro sobre estrógenos.
4. **La evidencia más fuerte para dormir con audio es la música calmante** (Cochrane 2022, certeza moderada). La app no la tenía; ahora sí.
5. **Una evidencia nueva importante:** Basner et al., *SLEEP* 2026. El ruido rosa continuo a 50 dBA **redujo el sueño REM ~19 min**, y los tapones de oído protegieron mejor el sueño. Por eso la app ahora recomienda usar ruido solo en cuartos ruidosos y a volumen suave.

---

## 2. Bugs encontrados y corregidos

| # | Bug | Impacto real | Cómo se verificó |
|---|-----|--------------|------------------|
| 1 | Detener y volver a dar Play dentro del fade de 2 s no hacía nada | El usuario presiona Play y no suena | Test en Chromium: antes `synthRunning=false` tras el clic; ahora suena |
| 2 | El `setTimeout` del fade anterior destruía los nodos de la sesión nueva (variables globales compartidas) | Sesión guiada en silencio mientras la UI decía "activa" | Test: antes nivel 0; ahora suena |
| 3 | El switch de ruido sin sintetizador no reproducía nada, pero Media Session decía "playing" | No se podía usar solo ruido | Test: antes nivel 0; ahora hay sesiones de solo ruido |
| 4 | El "ruido rosa" caía −6 dB/octava (es café). Era el algoritmo clásico de *brown noise* mal etiquetado | Rosa y café sonaban casi igual; los claims sobre ruido rosa no aplicaban | Medición espectral: antes ≈ −6 dB/oct; ahora **−2.97 dB/oct** (filtro de Paul Kellet) |
| 5 | Buffer de ruido de 2 s en loop, con discontinuidad en el punto de unión | Click audible cada 2 s y repetición perceptible | Antes el salto llegaba a 10× el paso típico; ahora el loop es continuo (filtrado circular, 15 s, estéreo) |
| 6 | Nivel del ruido = 5 % del master | El ruido quedaba ~34 dB bajo los tonos | Ahora las capas quedan balanceadas a ±2 dB, cada una con su slider |
| 7 | Tonos isocrónicos con compuerta cuadrada dura | Click en cada pulso | Pulso suave (armónicos 1-3-5): −17 dB de energía de click |
| 8 | Rampas de automatización sin ancla (`updateSynthParams`, tonos de respiración) | Saltos de frecuencia o volumen en Firefox/Safari | Ahora se usan `setTargetAtTime` y `holdParam` |
| 9 | Timer solo con `setTimeout` | Con la pantalla bloqueada el timer podía retrasarse y el sonido seguir sonando | El fade se programa en el reloj de audio; la UI se pone al día al volver a la app |
| 10 | La "Siesta 20 min" nunca tuvo timer: el `<select>` no tenía la opción 20 | La siesta sonaba indefinidamente | Ahora se pasan los minutos directamente, se agregó la opción de 20 min y una campana suave para despertar |
| 11 | IDs duplicados `guidedSessionIndicator`/`guidedSessionName`; el visible era el de la vista oculta | La sesión guiada no mostraba "activa" ni el botón para terminar | Test: el indicador ahora es visible |
| 12 | Si fallaba el CDN de GSAP, el script moría: sin navegación por vistas ni service worker | App rota con redes lentas o bloqueadoras | Test con GSAP bloqueado: las vistas funcionan |
| 13 | El service worker servía la versión anterior (cache-first y `CACHE_NAME` sin cambiar) | Los usuarios veían cada deploy una visita tarde | Navegación network-first + `sleeplab-v2` |
| 14 | El SW nunca cacheaba los CDNs (respuestas opacas, status 0) | El modo offline dependía de la suerte | Se aceptan respuestas opacas solo para CDNs permitidos |
| 15 | Acordeones cortados (`max-height: 2000px`) | CBT-I y Sleep Tech ilegibles en móvil | 12000px |
| 16 | El error de la calculadora se escribía dentro de una caja oculta | El error no se veía | Test: el error es visible |
| 17 | Sin listener de `hashchange` | Los enlaces internos y los atajos del manifest a veces no cambiaban de vista | Test |
| 18 | Claves i18n faltantes (`level2.*`), `nav.home/learn` agregadas después de traducir, `tools.synth.desc` duplicada | Textos en inglés en modo español | Script: 0 claves faltantes o huérfanas |
| 19 | Íconos inexistentes en el SW; enlaces "Try Sleep Tools"/"Open Lab" apuntaban al Home | 404 y navegación confusa | Corregido |
| 20 | Accesibilidad: `role="switch"` con `aria-pressed`, selects y sliders sin label, `aria-describedby` roto | Lectores de pantalla | Ahora `aria-checked`, labels reales y `aria-live` en el estado |

---

## 3. Qué dice la evidencia (resumen por sonido)

| Sonido | Nivel | Hallazgo clave | Fuente |
|--------|-------|----------------|--------|
| **Música calmante** | Moderado | 13 ECA, 1,007 personas: PSQI −2.79 (certeza moderada). 25–60 min, ≈52–85 BPM, al acostarse. Sin cambio en el sueño objetivo | Jespersen 2022, Cochrane ([PMC9400393](https://pmc.ncbi.nlm.nih.gov/articles/PMC9400393/)) |
| **Respiración 6/min** | Moderado (VFC) / limitado (sueño) | 20 min a 6/min antes de dormir acortaron la latencia en insomnio (PSG, n=28). Aumenta la VFC de forma consistente | Tsai 2015 ([PMID 25234581](https://pubmed.ncbi.nlm.nih.gov/25234581/)); Laborde 2022 ([PMID 35623448](https://pubmed.ncbi.nlm.nih.gov/35623448/)) |
| 4-7-8 y box | Muy débil | "Poco soporte empírico"; 6/min subió más la VFC | Marchant 2025 ([PMID 39864026](https://pubmed.ncbi.nlm.nih.gov/39864026/)) |
| Suspiro cíclico | Moderado (ánimo) | 5 min/día mejoró el ánimo más que mindfulness; sin cambio en sueño | Balban 2023 ([PMC9873947](https://pmc.ncbi.nlm.nih.gov/articles/PMC9873947/)) |
| **Ruido rosa/blanco continuo** | Débil / contradictorio | Ayuda a tapar ruido intermitente; en cuarto silencioso no hay beneficio probado. **A 50 dBA, REM −18.6 min**; los tapones protegieron mejor | Riedy 2021 ([PMID 33007706](https://pubmed.ncbi.nlm.nih.gov/33007706/)); Basner 2026 ([PMC13163165](https://pmc.ncbi.nlm.nih.gov/articles/PMC13163165/)) |
| "Boost" de sueño profundo con ruido rosa | Solo con EEG | Requiere pulsos de ~50 ms sincronizados con ondas lentas medidas por EEG. El ruido continuo no lo reproduce | Ngo 2013 ([PMID 23583623](https://pubmed.ncbi.nlm.nih.gov/23583623/)); Wunderlin 2021 ([PMID 33406249](https://pubmed.ncbi.nlm.nih.gov/33406249/)) |
| Beats binaurales | Débil | Un estudio PSG pequeño: 3 Hz sobre 250 Hz → más N3. El entrainment por EEG es inconsistente (5 de 14 estudios). Requiere audífonos. Por debajo de ~3 Hz se oye como un tono que "rota", no como beat | Jirakittayakorn 2018 ([PMC6165862](https://pmc.ncbi.nlm.nih.gov/articles/PMC6165862/)); Ingendoh 2023 ([PMC10198548](https://pmc.ncbi.nlm.nih.gov/articles/PMC10198548/)) |
| Tonos isocrónicos | Sin estudios de sueño | El claim "15 % más efectivo (Manns 1981)" no tiene sustento. Pulsos rítmicos de ~0.8 Hz **retrasaron** el inicio del sueño | Ngo 2013 J Sleep Res ([PMID 22913273](https://pubmed.ncbi.nlm.nih.gov/22913273/)) |
| Ruido café | Sin estudios de sueño | No hay estudios publicados de sueño | — |
| 40 Hz gamma | No es ayuda para dormir | Es una terapia diurna para Alzheimer (ensayos mixtos); la respuesta a 40 Hz cae a un tercio o la mitad durante el sueño | Plourde 1991 ([PMID 1814147](https://pubmed.ncbi.nlm.nih.gov/1814147/)) |
| Sonidos naturales | Débil | Aumentan la actividad parasimpática despierto; casi no hay datos de sueño | Gould van Praag 2017 ([PMC5366899](https://pmc.ncbi.nlm.nih.gov/articles/PMC5366899/)) |
| App de sonidos (ECA 2026) | Nulo | "Sleep Sounds" no superó al control digital (n=495) | Vazzaz 2026, *SLEEP* ([PMID 42223503](https://pubmed.ncbi.nlm.nih.gov/42223503/)) |

**Volumen seguro:**
- La guía de la OMS para recámara es de 30 dB LAeq continuos.
- Los estudios de ruido para dormir usaron 40–50 dBA.
- En Hugh 2014 (*Pediatrics*), las 14 máquinas de sonido para bebé superaron 50 dBA a 30 cm, y 3 superaron 85 dBA.
- Recomendación: la app no puede medir dB, así que se dice en palabras: "solo lo suficiente para tapar el ruido, ~40–45 dB en la almohada, teléfono a ≥1 m".

**Nota:** el meta-análisis Stanyer 2022 (*J Sleep Res*, estimulación acústica) fue **retractado en 2026**. No se cita.

---

## 4. Cambios al motor de sonido (qué y por qué)

- **Arquitectura por sesión.** Cada Play crea su propia cadena de nodos, y detener solo destruye esa sesión. Esto elimina de raíz la familia de bugs de condiciones de carrera.
- **Tres capas independientes, cada una con su switch y su nivel:**
  - **Tonos cerebrales:** isocrónico o binaural.
  - **Ruido ambiental:** rosa, café, blanco u **olas del océano**.
  - **Música calmante generativa** (nueva).
  - Arriba de las tres hay un volumen maestro con curva perceptual (x²), que da control fino a volúmenes bajos, y un limitador de seguridad.
- **Defaults según la evidencia:**
  - Usuarios nuevos: música + ruido rosa suave, con los tonos opcionales y timer de 45 min.
  - Usuarios existentes: conservan su configuración anterior (solo tonos).
- **Presets de tonos:**
  - Sueño: 3 Hz sobre portadora de 250 Hz, los parámetros del único estudio PSG positivo. Antes era 0.5 Hz sobre 100 Hz: inaudible en bocinas de teléfono y en el rango de pulsos que retrasan el sueño.
  - Theta y alfa sobre 250 Hz.
  - Gamma 40 Hz sobre 400 Hz, etiquetado para uso diurno.
- **Olas del océano:** ruido rosa con un oleaje de 6 ciclos/min que guía la respiración de resonancia con los ojos cerrados.
- **Música generativa:**
  - Un acorde cada 10 s (una respiración a 6/min) y notas en retícula de 60 BPM.
  - Ataques y relajaciones largos, registro grave, sin letra y reverb sintética.
  - Las características siguen las de los ensayos de Cochrane.
  - El scheduler mira 12 s adelante para tolerar timers ralentizados con la pantalla bloqueada.
- **Timer:**
  - Fade lineal en dB del 15 % de la sesión (entre 30 s y 10 min), programado en el reloj de audio. Los cambios bruscos de nivel provocan microdespertares (Stanchina 2005; Sanok 2022).
  - Nuevas opciones de 20, 45 y 90 min, y "toda la noche".
- **Siesta:** campana suave con crescendo al terminar, programada en el reloj de audio.
- **Sesiones guiadas rediseñadas:**
  - Rutina nocturna = música + océano + respiración 6/min.
  - Estrés = binaural alfa + café + suspiro cíclico.
  - Nueva **"Enmascarar toda la noche"**: ruido rosa suave, solo para cuartos ruidosos.
- **Visualizador:** 32 bandas logarítmicas de 30 Hz a 8 kHz. Antes, todo lo que estaba debajo de 750 Hz caía en una sola barra.

### Respiración

- **Nuevo patrón por defecto: resonancia 6/min** (4 s inhalar, 6 s exhalar, 30 ciclos ≈ 5 min).
- El 4-7-8 se etiqueta como "popular, poca evidencia".
- El suspiro fisiológico pasa a "suspiro cíclico" (Balban 2023).
- Un solo motor genérico por fases reemplaza tres funciones casi idénticas. El progreso se calcula con el reloj real, sin deriva.
- **Señales de audio:** campana suave más grave (antes eran beeps de 330–523 Hz) y un "soplo" que sube al inhalar y baja al exhalar, para seguir el patrón con los ojos cerrados. Ahora respetan el volumen maestro.

---

## 5. Contenido y citas corregidas

- **Citas corregidas en Evidencia:**
  - Zhou 2012 (era *J Theor Biol*, no *Neuron*; el PMC apuntaba a un paper de estrógenos).
  - Ngo 2013 (el PMC era "DeepFruits").
  - Garcia-Argibay 2019 (el PMID era de oxibato de sodio).
  - "Gantt 2017, J Caring Sci" no existe; se reemplazó por Jirakittayakorn 2018.
  - Balban 2023 (el PMID era otra revisión).
- **Agregados:** Cochrane 2022 (música), Basner 2026 (ruido rosa y REM), Riedy 2021 y Tsai 2015.
- **Panel nuevo "Lo que dice la ciencia"** dentro del reproductor, con insignias de evidencia por sonido y enlaces a las fuentes.
- **Textos honestos** (EN/ES) en tonos, ruido, guía de uso y "qué esperar". Se eliminaron "efecto más fuerte", "FFR validado", "entrainment completo" y "café para ansiedad/TDAH".
- **Seguridad clínica:**
  - Cinta en la boca solo después de descartar apnea: el texto decía "obligatoria" sin advertencia.
  - Síndrome de piernas inquietas: ferritina meta ≥75 ng/mL (IRLSSG) con supervisión médica, en lugar de >50. Se quitó el magnesio como causa.

---

## 6. Pruebas

- **50 pruebas funcionales automatizadas (50/50 pasan)**, más una prueba del service worker en modo offline. Cubren:
  - condiciones de carrera
  - sesiones guiadas
  - capas en vivo
  - timer y fade
  - respiración
  - idioma
  - persistencia y migración de ajustes
  - calculadora
  - ruteo por hash
  - resiliencia sin CDN
  - timer con el reloj de audio suspendido (llamada en iOS)
  - cambio de idioma durante una sesión guiada
- **Métricas de audio** con `OfflineAudioContext`:
  - pendiente espectral: rosa −2.97, café −6.42, blanco 0.08 dB/oct
  - continuidad del loop
  - niveles RMS por capa
  - energía de click
- **Capturas** en móvil (390 px) y escritorio.

---

## 7. Segunda fase (incluida)

- **Tailwind compilado:**
  - Se reemplazó el CDN de ejecución (~300 KB de JS que compilaba estilos en cada carga, no apto para producción) por una hoja de estilos compilada de **37 KB** (`npm run build:css`, tailwindcss 3.4).
  - Se carga después de los estilos propios para conservar el mismo orden de cascada.
  - El service worker la guarda en caché desde la instalación.
- **Español completo** en las vistas Aprender y Recursos y en las notas de evidencia:
  - 545 textos traducidos con un diccionario por nodo de texto.
  - Al volver a inglés se restaura exactamente el original.
  - Los títulos de papers se dejan en su idioma original, como se citan.
- **Bebés:** advertencia en la guía de volumen (aparato lejos de la cuna, volumen bajo, sin ruido toda la noche).
- **iOS:** se declara la sesión de audio "playback" antes de crear el AudioContext, para que el switch de silencio no apague el sonido.
- **Carga más rápida:**
  - Three.js (~600 KB, solo partículas decorativas) ya no bloquea el primer render: se carga después de que la página es interactiva.
  - Se omite si el usuario pidió "reducir movimiento" o ahorro de datos.
  - Renderiza a ~20 fps en lugar de 60, un tercio del consumo de GPU y batería.
- **Citas del resto de la sección de Evidencia:** se verificaron las 32 restantes. Solo 7 estaban bien: 21 IDs apuntaban a papers sin relación (genética de arroz, aspergilosis, un editorial de impresión 3D), 3 papers no existían como se citaban y 1 afirmación no coincidía con el estudio. Todas se reemplazaron por el paper correcto, verificado por título, autores, año y revista, con la afirmación ajustada a lo que el estudio encontró.
- **Revisión de código (10 hallazgos, todos corregidos):**
  - contador que seguía corriendo al cambiar de sesión guiada;
  - acordes amontonados tras una pausa larga del teléfono;
  - service worker que mezclaba HTML nuevo con CSS viejo o guardaba páginas que no eran la app;
  - las sesiones guiadas ya no sobrescriben tu configuración, que se restaura al terminar;
  - timer que no terminaba si iOS no reanudaba el audio;
  - indicador de sesión guiada que no se limpiaba;
  - textos en vivo (fase de respiración, error de la calculadora) que se perdían al cambiar de idioma.
- **Timer robusto:** si el audio se suspende (por ejemplo, una llamada), la sesión espera a que el fade termine en el reloj de audio en vez de cortarse.

## 8. Pendientes recomendados

1. **Probar en dispositivos reales** con la pantalla bloqueada (iOS Safari y Android Chrome), sobre todo la música generativa y la campana de siesta. [Probable que funcione; no verificable en headless]
2. Diario de sueño (TCC-I): sigue siendo la función de mayor valor clínico que falta (ya estaba en reportes previos).
3. Evaluar reemplazar el fondo 3D por CSS puro si las métricas de carga en teléfonos lo justifican.
