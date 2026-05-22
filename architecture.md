# Project Architecture & Context: Comercio Local

## 1. Visión del Proyecto

Comercio Local es una aplicación web comunitaria enfocada en dispositivos móviles (Mobile-First) pero adaptada a pantallas grandes. Su objetivo es actuar como un directorio o cartelera digital para visibilizar a emprendedores, productores y trabajadores de oficios independientes dentro de localidades específicas (ej. Ayacucho, Tandil, etc.), permitiendo el contacto directo a través de WhatsApp sin intermediarios ni pasarelas de pago internas.

---

## 2. Stack Tecnológico

- **Frontend / Routing:** Astro (v4+) utilizando TypeScript.
- **Estilos / UI:** Tailwind CSS.
- **Gestión de Paquetes:** pnpm.
- **Próximos pasos de Backend:** NestJS + TypeScript (para API REST).

---

## 3. Decisiones de Diseño e Interfaz (UI/UX)

- **Paleta de Colores:** Enfoque en Modo Oscuro Premium. Fondo base gris ultra oscuro (`#121212` / `#0a0a0a`) con un sutil degradado radial en tonos verde esmeralda. El color de acento predominante es el **Verde Esmeralda/Mate** (`emerald-500` / `emerald-600`) para generar cohesión con el destino final de la conversión (WhatsApp) y transmitir confianza comunitaria.
- **Layout Responsive:**
  - _Mobile:_ Una sola columna optimizada para scroll vertical rápido.
  - _Desktop:_ Grilla de 2 columnas (`md:grid-cols-2`).
- **Consistencia de Tarjetas de Presentación (Feed General):**
  - Para evitar desproporciones y fatiga visual, el feed principal muestra **tarjetas de presentación compactas y limpias** (no los catálogos enteros).
  - Cada tarjeta posee un banner de portada superior, avatar o iniciales del profesional, categoría, localidad y biografía corta de hasta 150 caracteres.
  - Incorpora un botón destacado **"📖 Ver Catálogo y Perfil"** que conecta a la vista detallada pública del profesional, además de su botón directo de WhatsApp.
  - Si el usuario no sube fotos de portada o logo, se inyectan imágenes de respaldo de alta calidad clasificadas por su rubro (_comidas, oficios, artesanias, jardineria, estetica, educacion, tecnologia, otros_).

---

## 4. Estrategia de Geolocalización e Interactividad Híbrida

Para evitar costos elevados de APIs de mapas y solicitudes invasivas de permisos GPS nativos, el proyecto utiliza un **Enfoque Híbrido**:

1.  **Persistencia:** Cada perfil de creador/comercio posee un campo de `ciudad` en su registro (ya sea predefinido como 'Ayacucho', 'Tandil', 'Balcarce', 'Rauch' o ingresado libremente con "Otra localidad...").
2.  **Filtrado de Localidad:** El feed principal se filtra dinámicamente según la localidad elegida en la cabecera.
3.  **Localidades Dinámicas:** Cualquier localidad nueva ingresada por un comerciante se indexa en tiempo real en la base de datos de `localStorage` para que todos los usuarios del feed principal puedan seleccionarla y filtrarla dinámicamente.
4.  **Base de Datos en Transición (Fase Cliente):** El sistema opera con una base de datos local basada en `localStorage` sincronizada en tiempo real.

---

## 5. Sistema de Cuentas, Autenticación y Gestión de Perfiles

El sistema de cuentas permite a los creadores autogestionar su presencia en la cartelera comunitaria.

### Estructura del Modelo de Datos (Creador & Portafolio):

Cada cuenta de creador se compone de:

- `id`: string (Identificador único autogenerado)
- `email`: string (Credencial de acceso única)
- `password`: string (Contraseña de acceso con validación estándar: mín. 6 caracteres, letras y números)
- `nombre_emprendimiento`: string (Nombre del negocio o profesional autónomo)
- `categoria`: enum ('comidas', 'oficios', 'artesanias', 'jardineria', 'estetica', 'educacion', 'tecnologia', 'otros')
- `descripcion`: string (Máx. 150 caracteres para la biografía corta del feed)
- `whatsapp`: string (Formato numérico internacional, ej: "54911...")
- `ciudad`: string (Localidad de origen)
- `fotoLogo`: string (URL opcional de avatar o logotipo de perfil)
- `fotoPortada`: string (URL opcional de banner o fondo de portada)
- `productos`: array de objetos:
  - `id`: string / number (Identificador de la publicación)
  - `titulo`: string (Nombre del artículo o servicio comercial)
  - `precio`: number (Opcional, en ARS)
  - `foto`: string (URL de foto obligatoria del artículo/servicio)
  - `descripcion`: string (Descripción breve obligatoria de hasta 80 caracteres)

### Estructura de Vistas e Interacciones:

1.  **Vista de Login (`/login`):** Acceso tradicional y botones visuales de login social mockeados (Google, Facebook, WhatsApp).
2.  **Vista de Registro (`/registro`):** Alta con inputs de logos, banners y selector dinámico de "Otra localidad...".
3.  **Vista de Perfil Público (`/perfil?id=usr_xxx`):** Página dedicada a mostrar el banner completo, avatar, biografía, botón flotante de WhatsApp y la grilla con el catálogo extendido detallado del comerciante.
4.  **Vista de Panel de Control (`/dashboard`):** Edición de perfil y catálogo interactivo con modo de edición bidireccional (agregar, borrar y editar productos del portafolio en caliente con previsualización en vivo).
