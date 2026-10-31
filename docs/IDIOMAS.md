# Traducción completa de Comidadle: trabajo en curso

La publicación se hará después de revisar los idiomas, según la decisión del dueño. Esta rama prepara los catálogos y las herramientas de revisión. **Todavía no implementa la traducción de todo el juego.** `index.html`, `sw.js` y `manifest.json` conservan el código que ya estaba publicado; no cargan el nuevo motor.

## Idiomas acordados

Español, inglés, francés, alemán, portugués de Brasil y portugués de Portugal. Las dos variantes de portugués tienen archivos propios y textos distintos, por ejemplo «Salvar/Guardar», «Compartilhar/Partilhar» y «Configurações/Definições».

## Estado comprobado

- 1.082 platos normales y 72 internacionales en el código real: 1.154 descripciones y 5.770 pistas.
- 49 claves heredadas de interfaz por idioma en el primer borrador. Inglés y francés proceden del sistema existente; alemán y las dos variantes de portugués tienen una primera traducción de ese bloque. Ningún idioma nuevo está aprobado.
- 1.396 candidatos adicionales extraídos de HTML, atributos, controladores en línea y JavaScript. Incluyen fragmentos y valores técnicos que deben clasificarse; la cifra no es un recuento definitivo de mensajes traducibles.
- Los platos todavía no están traducidos. La revisión muestra «Pendiente de traducir», sin presentar el español como una traducción completada.
- El motor nuevo está probado por separado, pero falta conectarlo a todas las pantallas y funciones del juego.

## Revisar en local

```powershell
npm ci
python -m http.server 8080
```

Abrir `http://localhost:8080/i18n/review.html`. El buscador permite localizar pistas y descripciones por nombre del plato o por clave. La vista no inicia sesión ni escribe en Supabase y no usa el almacenamiento de progreso del juego.

```powershell
npm test
npm run i18n:test-browser
npm run i18n:check
```

La prueba de navegador utiliza Chrome instalado. `i18n:check` **debe fallar en este momento**: los idiomas están incompletos, sin revisión y sin conexión con la interfaz. Ese fallo no se debe convertir en éxito omitiendo catálogos o marcándolos como revisados.

## Catálogos y lógica

`npm run i18n:audit` regenera el inventario español. `npm run i18n:prepare` prepara la fuente del motor y crea borradores sin sustituir traducciones existentes. Si cambia la huella de la fuente, los borradores antiguos quedan bloqueados hasta revisar su correspondencia y actualizar su revisión de forma explícita.

Los países canónicos, las respuestas, los IDs, las claves de almacenamiento y los datos enviados a Supabase permanecen separados del texto mostrado. El motor devuelve vistas traducidas de los platos sin modificar los objetos originales. Los nombres de países se muestran mediante `Intl.DisplayNames` a partir de sus banderas. Los plurales utilizan reglas del idioma; el alemán no puede resolverse añadiendo una «s».

Los catálogos se cargan como datos. Las variables se interpolan sin ejecutar JavaScript y la presentación enriquecida solo permite `strong`, `em` y `br`, escapando los valores insertados. Una descarga antigua no puede sobrescribir una elección de idioma posterior.

## Trabajo pendiente antes de publicar

1. Clasificar el inventario y convertir las concatenaciones en mensajes completos con variables con nombre, evitando fragmentos que cambien el orden de las palabras.
2. Conectar cada uso de interfaz a sus claves: acceso, perfil, configuración, estadísticas, rankings, amigos, duelos y chat del sistema, tienda, logros, misiones, notificaciones del sistema, reglas, changelog, compartir, exportación y todos los modos.
3. Traducir y revisar todos los mensajes, los nombres descriptivos de platos, las descripciones y las pistas, conservando los nombres propios cuando corresponda.
4. Revisar el ocultamiento de países y gentilicios en cada idioma para evitar revelar respuestas. Comprobar trivia, pasaporte, historial, domingo, infinito y memoria.
5. Definir cómo tratar los avisos redactados por el dueño y enviar el idioma a la función de recetas. Los mensajes de jugadores conservarán su contenido original.
6. Añadir el selector al juego, migrar la preferencia antigua y actualizar metadatos, accesibilidad, fechas, números y textos compartidos.
7. Incorporar los archivos necesarios a la caché y probar carga inicial, recarga, cambio de idioma y uso sin conexión en escritorio y móvil.
8. Revisar cada flujo en los seis idiomas, resolver todos los fallos de `i18n:check` y solo entonces activar y publicar la traducción completa.

No hay claves de servicios de traducción ni llamadas a traductores externos en el motor o la vista de revisión.
