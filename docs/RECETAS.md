# Activación de recetas y precio orientativo

La conexión de Supabase ya funciona. El 1 de noviembre de 2026 se desplegó dish-recipe, versión 1, en el proyecto comidadle (dacgheuzlhybesnqjqzn), con verificación de JWT activada. La comprobación real de CORS devuelve HTTP 200 y una solicitud de receta sin sesión devuelve HTTP 401. Ya no responde 404.

Todavía falta verificar la configuración de ANTHROPIC_API_KEY y una receta real con una sesión de usuario. Las herramientas disponibles no permiten consultar ni configurar los secretos de Edge Functions. El propietario debe comprobar el nombre ANTHROPIC_API_KEY en Edge Functions → Secrets y, si falta, guardar allí el valor de su clave de Anthropic. No debe compartirlo en el chat ni incluirlo en GitHub. Las pruebas de receta y precio de navegador usan respuestas simuladas; no prueban una generación real.

La función preparada está en supabase/functions/dish-recipe/index.ts. Verifica la sesión y solicita una receta para cuatro personas, en el idioma elegido, con una estimación explícita del coste de ingredientes en euros. El coste es orientativo, no una cotización de compra en tiempo real. La clave del proveedor permanece en el servidor.

Para terminar la activación: comprobar la configuración del proveedor y verificar una petición real con una cuenta de prueba, revisando tanto la receta como su coste. El perfil local de demostración no equivale a una sesión real de Supabase. Al guardar el secreto no es necesario volver a desplegar la función.

También puede desplegarse desde el panel web: Edge Functions → Deploy a new function → Via Editor, usando el nombre dish-recipe y el código preparado. Los secretos se configuran en Edge Function Secrets. Fuentes: [editor y despliegue](https://supabase.com/docs/guides/functions/quickstart-dashboard), [secretos](https://supabase.com/docs/guides/functions/secrets).
