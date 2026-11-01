# Idiomas: versión jugable para revisión

Hay catálogos completos para español, inglés, francés, alemán, portugués de Brasil y portugués de Portugal. Cada catálogo contiene 1.228 claves de interfaz, 1.154 descripciones y 5.770 pistas. Los nombres originales se mantienen y los títulos descriptivos traducidos aparecen debajo, sin duplicar nombres tradicionales que se mantienen iguales. El campo displayName está separado del nombre canónico name y no cambia respuestas, semillas ni progreso. **Completo significa que existen todos los textos; no significa que cada traducción haya superado una revisión editorial.** Ningún idioma nuevo está aprobado para producción.

## Uso

Con el servidor local del README, abrir `/preview/index.html`. Elegir el idioma en el acceso o en Configuración. El botón de demostración permite jugar sin crear una cuenta, probar los modos y consultar los cosméticos con un perfil local. `/i18n/review.html` muestra el original y la traducción, con búsqueda por texto, plato o clave.

El arranque de la demo bloquea las mutaciones a Supabase, incluso con una cuenta real. Solo permite las solicitudes necesarias de acceso y consultas públicas; recuperación de contraseña, creación de cuenta, compras, comentarios, regalos, sincronización y partidas multijugador reales no se ejecutan. Los duelos se verifican con datos simulados en las pruebas. El perfil de demostración no se guarda como una sesión real. Esta protección pertenece a la demo y debe revisarse al preparar producción.

La preferencia de idioma usa `comidadle_preview_lang`. El progreso sigue las claves existentes del juego dentro del origen local de prueba. No se debe alojar esta demo bajo el origen de producción antes de revisar la separación del almacenamiento. La caché `comidadle-preview-*` conserva los seis catálogos y no elimina las cachés del juego público. La primera carga necesita conexión para los recursos externos; después se prueba el arranque local sin red.

## Implementación

`scripts/build-game-preview.mjs` analiza el código original con Acorn y el HTML con parse5. Genera `preview/index.html`, `app.js`, `sw.js` y `manifest.json`, además de las claves de origen y enlaces estáticos. No modifica los archivos públicos de la raíz.

Se traducen textos estáticos, atributos visibles y mensajes construidos por JavaScript: acceso, configuración, perfil, estadísticas, clasificaciones, tienda, logros, misiones, pasaporte, reseñas, reglas, novedades, mensajes del sistema, compartir y modos del juego. Los países se muestran con `Intl.DisplayNames`; fechas, números, ordinales y plurales se adaptan al idioma. Un único filtro geográfico protege nombres, subtítulos, descripciones y pistas antes de resolver la ronda. Incluye los nombres de países en seis idiomas, gentilicios, regiones y ciudades, con variantes como vasco/basque/baskisch/basco y panaméens/panamenho. Tras resolver se revela el texto. No se aplica a perfiles ni comentarios de jugadores.

Los IDs, países canónicos, semillas, respuestas y parámetros de eventos conservan sus valores. Las traducciones afectan a la presentación. No se traducen nombres de jugadores, mensajes de chat ni comentarios escritos por usuarios. Una instantánea de 22 artículos públicos permite traducir los textos de tienda conocidos; artículos o avisos nuevos requieren actualizar la fuente. Los avisos libres redactados después no se traducen automáticamente.

`i18n/runtime.js` carga JSON, comprueba la versión de la fuente y escapa variables. Solo permite `strong`, `em` y `br` en mensajes enriquecidos. Impide que una descarga antigua sustituya un idioma elegido posteriormente. `game-boot.js` conecta el motor y ofrece la demostración; no usa un observador que traduzca contenido de jugadores.

## Generar y mantener los textos

Los borradores iniciales de inglés, francés, alemán y portugués brasileño se generaron en CPU local con OPUS-MT/CTranslate2, protegiendo variables, marcas, nombres culinarios y enlaces. Los modelos y resultados intermedios quedan en `.translation-cache`, fuera de Git; el juego solo descarga los JSON finales.

El token experimental `pt_PT` produjo mezclas de idiomas y su salida se descartó. `scripts/adapt-pt-pt.cjs` usa la base portuguesa brasileña completa y aplica vocabulario europeo, ortografía regional y controles propios de Portugal. Esta adaptación necesita revisión editorial de las frases y su naturalidad.

Requisitos de generación: Python con `ctranslate2` y `sentencepiece`, Node.js y acceso inicial a los modelos. Las dependencias Python pueden instalarse en `.translation-cache/python` sin modificar el entorno global.

```powershell
npm run i18n:audit
npm run i18n:prepare
npm run i18n:build-preview
python scripts/generate-all-translations.py
npm run i18n:review-ui
npm run i18n:build-preview
npm run i18n:check-preview
```

La generación se reanuda gracias a su caché. Después se aplican siempre los controles revisados y se reconstruye la demo para actualizar la caché. Los cambios de fuente exigen regenerar los catálogos afectados; no se debe actualizar su huella sin comprobar su correspondencia.

## Comprobaciones y publicación

Las 29 pruebas unitarias cubren datos canónicos, semillas, almacenamiento, claves referenciadas, cobertura estática, cambios de idioma, plurales, escape, bloqueo de borradores, recetas y regresiones anteriores. Las pruebas de Chrome recorren los seis idiomas en pantalla móvil: partida diaria, infinito, memoria, conservación del progreso y XP al cambiar idioma, pantallas secundarias, duelos simulados y ausencia de escrituras reales. La prueba sin conexión comprueba restauración de la demo, progreso, catálogos y conservación de la caché pública.

`i18n:check-preview` exige textos, pistas, variables, marcado y versión completos. `i18n:check` añade las aprobaciones de publicación y debe seguir fallando mientras `applicationCoverageReviewed` y la revisión editorial completa sigan pendientes. Las pruebas técnicas no sustituyen la revisión lingüística.

Antes de publicar quedan: revisar cada frase en contexto y corregir los borradores; comprobar flujos con cuentas de prueba y datos reales autorizados; cerrar la política de avisos nuevos; preparar la migración de almacenamiento y caché al origen público; integrar la versión aprobada en la raíz y desplegar la función de recetas si se desea habilitarla. `supabase/functions/dish-recipe/index.ts` solicita el idioma elegido al proveedor, valida la sesión y mantiene su clave en el servidor. Está probada localmente y **no se ha desplegado**; la demo permite las solicitudes de recetas, que requieren el servicio activo.

Se conserva la versión pública 3.3.0 y su changelog. La rama y la PR permanecen en borrador hasta terminar la revisión acordada.

La auditoría de navegador recorre los 1.154 platos en cada uno de los seis idiomas (6.924 combinaciones) y comprueba que los términos detectados quedan ocultos en los campos de juego, conservando las traducciones originales. Reproduce las capturas de Hojaldras Panameñas, Pollo en Pepitoria Cubana y Pepitoria de Gallina. Los selectores de idiomas muestran banderas. Esta auditoría técnica no equivale a una revisión lingüística humana de todas las frases.

## Correcciones del pasaporte y del ocultamiento

El pasaporte se representa con nodos DOM y eventos propios, con países localizados, cuadrícula sin huecos y platos descubiertos como botones de receta. Los platos pendientes se agrupan en un resumen y al abrir un país se cierra la ventana anterior. Las recetas se solicitan en el idioma activo; la demo permite esta operación de lectura, conservando el bloqueo de escrituras en las tablas. Actualmente el servicio devuelve 404 y requiere activación: ver [RECETAS.md](RECETAS.md).

Se conserva el azúcar francés (sucre), la lima de las recetas y otros alimentos ambiguos. Las referencias geográficas amplias, como los Andes y el Caribe, se conservan como pistas; los países, sus gentilicios y regiones específicas siguen ocultos. Si no existe un título traducido distinto, se muestra una explicación traducida sin duplicar la descripción ni saltarse el modo sin descripción. Se revisaron también los platos señalados en las capturas, sus pistas y las etiquetas francesas de las pestañas.
