# Comidadle

Juego en español servido como web estática. Código importado del ZIP `comidadle.github.io-main.zip`.

## Ejecutar en local

Desde esta carpeta, con Python instalado:

```powershell
python -m http.server 8080
```

Abrir http://localhost:8080. El modo sin conexión necesita una primera visita con red. Los proveedores de autenticación pueden necesitar configurar el origen local en Supabase.

## Comprobar las correcciones

Con Node.js instalado:

```powershell
node --test tests/regression.cjs
```

Las pruebas cubren la fecha local de la semana, el reinicio de puntos con una pestaña abierta, la actualización del token REST y los archivos guardados por el service worker. Usan dobles locales; no llaman a Supabase ni sustituyen la verificación en un navegador real.

## Correcciones locales

- El service worker guarda `index.html`, que es el archivo incluido en el proyecto. Se distingue la caché corregida para retirar la anterior.
- El token de las peticiones REST sigue los eventos de Supabase Auth.
- La semana se calcula en fecha local y se renueva antes de consultar o modificar los puntos, conservando el resumen de la semana anterior.

Se conserva la versión del juego 3.3.0 y su changelog.

## Pendiente

- Verificar tablas, restricciones y políticas de Supabase antes de cambiar la sincronización del ranking.
- Resolver el cambio de nombre en el ranking semanal y las inserciones simultáneas de varias pestañas. Las correcciones locales todavía no solucionan esos dos problemas.
- Revisar el acceso a `email_for_username`, `app_secrets` y `xp_gifts`, y el estado real de las funciones `username-login` y `dish-recipe`.
- Comprobar la instalación PWA y los flujos de sesión en navegador real.

Los cambios de código están subidos a la rama `main` de `comidadle/comidadle.github.io`. No se han aplicado cambios remotos a Supabase.

## Idiomas en preparación

La rama de idiomas contiene un motor independiente, catálogos en borrador y una vista de revisión en `http://localhost:8080/i18n/review.html`. Todavía no traduce todo el juego ni está conectado a `index.html`. La traducción se publicará después de revisarla. El alcance, el estado real y las comprobaciones están documentados en [docs/IDIOMAS.md](docs/IDIOMAS.md).
