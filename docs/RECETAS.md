# Recetas y precios aproximados

La función `dish-recipe` genera una receta con Gemini 3.8 Flash usando el nivel gratuito de Google AI Studio. La clave se guarda únicamente como secreto de la Edge Function `GEMINI_API_KEY`; nunca se incluye en el cliente ni en GitHub. El nivel gratuito tiene límites de uso y sus condiciones pueden cambiar. Las solicitudes solo incluyen nombre y país del plato, idioma y código de moneda; no se envían datos de la cuenta.

Para mostrar precios, la función pide una estimación amplia del coste de ingredientes para cuatro raciones en la moneda del país del plato. Si la moneda del perfil es distinta, convierte ese rango con el tipo de referencia diario disponible de Frankfurter. Es una estimación orientativa, no un precio de tienda ni una cotización en tiempo real. Si no hay tipo de cambio para una moneda, se muestra el precio de origen.

## Activación

1. Crear una clave gratuita en Google AI Studio.
2. En Supabase, abrir Edge Functions → Secrets y guardar `GEMINI_API_KEY`.
3. Desplegar la función `dish-recipe` desde `supabase/functions/dish-recipe/index.ts` para aplicar la versión nueva.
4. Iniciar sesión en la web y abrir un plato descubierto para comprobar la receta.

No compartir ni subir la clave a GitHub. La generación real no se ha probado porque requiere que el propietario añada su propia clave gratuita.

Fuentes: [nivel gratuito de Gemini API](https://ai.google.dev/gemini-api/docs/pricing), [tipo de cambio de referencia de Frankfurter](https://frankfurter.dev/v2/).
