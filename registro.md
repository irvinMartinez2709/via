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
