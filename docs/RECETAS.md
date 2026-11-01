# Activación de recetas y precio orientativo

El endpoint configurado devuelve HTTP 404: la función dish-recipe todavía no está desplegada. No hay una clave del proveedor configurada en el alojamiento privado de la demo. Las pruebas de receta y precio de navegador usan respuestas simuladas; no prueban una generación real.

La función preparada está en supabase/functions/dish-recipe/index.ts. Verifica la sesión y solicita una receta para cuatro personas, en el idioma elegido, con una estimación explícita del coste de ingredientes en euros. El coste es orientativo, no una cotización de compra en tiempo real. La clave del proveedor permanece en el servidor.

Para activarla con la conexión de Supabase: seleccionar el proyecto del juego, comprobar la configuración del proveedor y desplegar dish-recipe con el archivo preparado. Si falta ANTHROPIC_API_KEY, debe configurarse como secreto del proyecto. No se debe añadir al código web ni a GitHub. Después se debe verificar una petición real con una cuenta de prueba y revisar tanto la receta como su coste. El perfil local de demostración no equivale a una sesión real de Supabase.

También puede desplegarse desde el panel web: Edge Functions → Deploy a new function → Via Editor, usando el nombre dish-recipe y el código preparado. Los secretos se configuran en Edge Function Secrets. Fuentes: [editor y despliegue](https://supabase.com/docs/guides/functions/quickstart-dashboard), [secretos](https://supabase.com/docs/guides/functions/secrets).
