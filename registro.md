[Nombre posible del proyecto (basado en el nombre de la carpeta donde está el trabajo)]
Via

[número de la indicación, autoincrementado desde 1]
1

[Fecha y hora en que ocurrió]
2026-08-18 10:15

[Indicación dada por el usuario]
Crear una app para Android para anotar autobuses que transito ("Via"): 1) nombres de buses "lugar1 - lugar2" con lugar principal a la izquierda; 2) horarios de ida y vuelta; 3) tarifas por tramo/parada (Potrerillos→David 1.50, Potrerillos→Dolega 0.95, Dolega→David 0.95; los buses no cobran acumulativo); 4) sección para elegir buses del día mostrando total de dinero, recordatorios personalizables (default 30 min antes) y mapa interactivo offline (opcional, se omite por no ser viable sin internet; en su lugar se implementó Lugares); 5) hora en la que pasa el bus por cada parada (paradas con minutos de recorrido); 6) buscador que ignore mayúsculas y con palabra similar encuentre bus/ruta/precios; 7) opciones de filtro. App intuitiva con preguntas. Logo: logo.png; Splash: splash.png + texto "Via" + subtexto "Tu guía de transporte". Crear repositorio privado; avisar cuando se necesite conectar el celular.

[Qué hice yo (OpenCode)]
- Pregunté 3 decisiones clave: modelo de precios (tarifas por tramo de subir/bajar, no acumulativas), recordatorios (personalizable + obligatorio 10 min antes), y arrancar sin datos de ejemplo.
- Creé el proyecto web-first en `Proyectos/Via/web/`: Vite + React + TS + Tailwind + Capacitor v6, tema claro/oscuro, splash con splash.png + "Via" + "Tu guía de transporte", doble retroceso para salir.
- Modelo de datos (types.ts): Bus (nombre, lugarPrincipal, paradas con minutos desde salida ida, salidasIda/salidasVuelta, tarifas por par de paradas, favorito), SeleccionDia, Config, Datos; persistencia en localStorage con claves `via.*.v1`, exportar/importar JSON y borrar todo (lib/almacen.ts).
- Búsqueda inteligente (lib/busquedas.ts, busquedaBus.ts, busquedaApp.ts): normalización (minúsculas+acentos), puntuación por nombre/paradas/tarifas y coincidencia difusa por Levenshtein; filtros todos/favoritos/sin tarifas.
- Cálculo de hora de paso por parada en ambos sentidos (lib/notificaciones.ts) y recordatorios con @capacitor/local-notifications v6 (id por sel+min, permiso, programar/cancelar).
- Componentes: Splash, ConfirmarDialog, Inicio (resumen + buscador + próximos hoy + favoritos), GestionarBuses (CRUD + búsqueda + filtros), BusFormulario (nombre "L1 - L2" parseado, paradas con minutos, horarios por comas, matriz de tarifas), BusCard (expandible), BusesHoy (selección bus/dirección/subida/bajada/hora/recordatorio + total del día), Lugares (desde→hasta con buses que conectan y precios), Configuracion (tema, recordatorio default, exportar/importar, Acerca de, Ayuda, borrar datos), nav inferior con 5 secciones.
- Workflow `.github/workflows/build-android.yml`: build web, `cap add android`, versionName/versionCode desde package.json (1.0.0 → 10000), keystore persistente (via.p12, se guarda como secret en 1ª ejecución), firma, iconos con sharp desde Logo.png, APK firmado `Via-1.0.0.apk` + GitHub Release con descripción desde web/RELEASE.md.
- Scripts: `web/scripts/parchear-firma.mjs`, `web/scripts/generar-iconos.mjs`.
- Verifiqué: `npm run lint` y `npm run build` sin errores; suite Playwright 2/2 PASS (flujo completo: crear bus, tarifas, favorito, buses de hoy con total, lugares, búsqueda difusa "davod", persistencia tras recarga).
- Creé repo privado `github.com/irvinMartinez2709/via`, commit `d8aac9b`, push a main (dispara workflow).
- Pendiente: esperar el APK de la Release y preguntar al usuario si quiere instalarlo/verificarlo por adb.

## Sesión 5 - 2026-08-18
- Workflow #2 quedó en cola (runner colgado); se canceló y se relanzó (run #3): conclusion success.
- Secrets configurados vía API con cifrado libsodium sealed box (X25519): ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, GH_PAT.
- Release 1.0.0 creada con asset Via-1.0.0.apk (3.9 MB), descargado a apk/.
- registro.md commiteado (c9b2701).
- Instalado por adb en Redmi (2409BRN2CL): Success; versionName 1.0.0, versionCode 10000; arranque sin FATAL (PID confirmado).

## Sesion 6 - 2026-08-19
- Requisitos: logo nuevo, color de elementos (8+ presets), modos de emojis (color/mono/ninguno), Lugares con lista desplegable, tiempos de parada con stepper interactivo y desfase (pasa antes/despues del horario), fix tarifas/paradas, aviso de salir abajo, UI propia sin select nativo, reutilizar lugares entre buses, ayuda mas clara, mas resumen en Inicio.
- Implementado: tipos (Parada.desfase, Config.color/emojis) + migracion en almacen; 10 presets CSS; componente Emoji; Selector propio (reemplaza select), Stepper (+/- con pulsacion mantenida), Combo autocompletar; BusFormulario con steppers y sugerencias de lugares de otros buses; BusesHoy sin select nativo; Lugares con combobox; aviso de salir en bottom-24; Configuracion con presets y emojis; Inicio con resumen (lugares, paradas, sin tarifas, guia primer bus); RELEASE 1.1.0; logo copiado.
- Playwright 3/3 PASS. lint + build OK. version 1.1.0.

## Sesion 6b - 2026-08-19
- v1.1.0: workflow run #6 success; release 1.1.0; APK descargado a apk/.
- Instalado en Redmi con --no-streaming (bug MIUI INSTALL_FAILED_USER_RESTRICTED): Success; versionName 1.1.0, versionCode 10100; sin FATAL (PID 26198).


## Sesion 7 - 2026-08-19
- 8 requisitos del usuario: 1) aclarar tiempos de parada (minutos en llegar) y pasar antes/despues a opcional + FAQ; 2) fix bug escribir tarifas (punto decimal se cortaba): nuevo TarifaInput con estado local; 3) tarifas reestructuradas como lista de tramos (Desde→Hasta) + tarifa de recorrido completo; 4) tarifa opcional de ruta completa al crear bus; 5) UX mas intuitiva; 6) presets tiñen TODA la app (fondo/tarjetas) via aplicarPaleta + color personalizado (input type=color); 7) mapa offline Chiriqui con Leaflet + MBTiles (sql.js + IndexedDB), importar .mbtiles en "Mas"; 8) steppers a paso 1 (paradas y recordatorio).
- Nuevos archivos: lib/colores.ts, lib/idb.ts, lib/mapa.ts, components/Mapa.tsx; deps: leaflet, sql.js, @types/leaflet, @types/sql.js.
- Seccion nav nueva "Mapa". Playwright actualizado (tarifas nueva UI) 3/3 PASS. lint+build OK. version 1.2.0.

## Sesion 7b - 2026-08-19
- v1.2.0: workflow run #8 success; release 1.2.0; APK descargado a apk/.
- Instalado por adb (--no-streaming): Success; versionName 1.2.0, versionCode 10200; sin FATAL (PID 28321). Datos conservados.


## Sesion 8 - 2026-08-19
- Bugs: 1) paradas saltaban de lugar al cambiar minutos (se ordenaban en vivo) -> se muestran en orden de insercion, se ordenan al guardar; 2) pulsacion mantenida no acumulaba (cierre de valor) -> Stepper con refValor que acumula, intervalo 100ms; 3) recorrido completo usaba 1a/ultima parada por minutos -> ahora usa el nombre del bus (ej. Potrerillos - David); 4) nuevos dias que circula: Bus.dias (0-6, default todos), selector L M X J V S D en el formulario, BusesHoy filtra por dia de hoy, BusCard muestra dias si no circula todos.
- Playwright 3/3 PASS (verificado: mantener + = 10min, sin saltos, recorrido segun nombre, indicador dias). lint+build OK. version 1.3.0.
