# Comidadle

Juego de adivinar el país de origen de un plato. La rama `codex/i18n-review` incluye una versión jugable para revisar español, inglés, francés, alemán, portugués de Brasil y portugués de Portugal antes de publicarlos.

## Probar desde móvil y PC

Abrir [la demo privada](https://comidadle-idiomas-demo.burlyonyx1.chatgpt.site/preview/index.html). Si pide acceso, entrar con la cuenta de ChatGPT propietaria. Este enlace funciona sin encender el servidor del ordenador.

## Ejecutar en el ordenador

```powershell
npm ci
python -m http.server 8765 --bind 127.0.0.1
```

Abrir [la demo](http://127.0.0.1:8765/preview/index.html), elegir el idioma y pulsar **Probar sin cuenta (demostración)**. También se puede cambiar desde Configuración. La demo bloquea las escrituras a Supabase; no modifica la cuenta ni el ranking reales. Las partidas de demostración se guardan en este navegador y origen local.

Los seis catálogos incluyen 1.231 claves de interfaz, 1.154 descripciones y 5.770 pistas por idioma. Se conserva el nombre original y se añade debajo su traducción cuando cambia en el idioma elegido. La [tabla de revisión](http://127.0.0.1:8765/i18n/review.html) permite buscar textos y compararlos con el español.

**Las traducciones siguen siendo borradores editoriales.** Hay generación automática inicial, controles revisados y adaptación regional portuguesa; no se ha aprobado cada frase. `index.html`, `sw.js` y `manifest.json` públicos conservan su contenido. Esta rama no activa los idiomas en producción.

## Verificar

Node.js 24 y Chrome instalado:

```powershell
npm test
npm run i18n:check-preview
npm run i18n:test-browser
npm run i18n:test-game
npm run i18n:test-offline
```

Las pruebas de navegador usan respuestas locales simuladas. Comprueban partidas, conservación del progreso, pantallas, comentarios originales, bloqueo de escrituras y arranque sin conexión. `npm run i18n:check` mantiene el bloqueo de publicación hasta completar la revisión editorial.

La arquitectura, generación y pendientes están documentados en [docs/IDIOMAS.md](docs/IDIOMAS.md). La función de recetas multilingües incluida está preparada y probada localmente; todavía no está desplegada en Supabase.
