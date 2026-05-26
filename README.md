# Comercio Local

Cartelera digital comunitaria para visibilizar emprendedores, productores y trabajadores independientes de tu localidad.

## Stack

- **Framework:** Astro 4 (SSR con Netlify)
- **Estilos:** Tailwind CSS v4
- **Base de datos:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email/contraseña, sin confirmación)
- **Hosting:** Netlify

## Comandos

| Comando             | Acción                         |
| ------------------- | ------------------------------ |
| `pnpm dev`          | Iniciar servidor de desarrollo |
| `pnpm build`        | Build para producción          |
| `pnpm preview`      | Preview del build              |
| `pnpm typecheck`    | Verificar tipos TypeScript     |
| `pnpm lint`         | Ejecutar ESLint                |
| `pnpm format`       | Formatear con Prettier         |
| `pnpm format:check` | Verificar formato              |
| `pnpm test`         | Ejecutar tests (Vitest)        |

## Variables de entorno

Copiar `.env.example` a `.env` y completar:

```
PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

## Base de datos

El schema está en `scripts/supabase-schema.sql`. Para inicializar:

1. Crear proyecto en Supabase
2. Ejecutar el schema en el SQL Editor
3. Configurar Authentication (email confirmación desactivado)
