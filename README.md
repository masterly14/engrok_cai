<div align="center">
  <h1 align="center">KarolAI</h1>
  <p align="center">
    Una plataforma todo-en-uno para automatizar la comunicación con clientes mediante Agentes de IA avanzados de Voz y Chat.
    <br />
    <a href="https://karolai.co"><strong>Explora la web »</strong></a>
  </p>
</div>

---

**KarolAI (Conversational AI)** es una potente aplicación construida con Next.js que te permite diseñar, implementar y gestionar agentes de inteligencia artificial para automatizar conversaciones por voz y WhatsApp. Desde la creación de flujos de diálogo complejos sin código hasta la gestión de leads en un CRM integrado, KarolAI proporciona todas las herramientas necesarias para escalar la comunicación de tu negocio.

## ✨ Características Principales

Esta plataforma está repleta de funcionalidades diseñadas para la máxima eficiencia y personalización:

- **🤖 Agentes de Voz y WhatsApp:** Crea y personaliza agentes de IA para automatizar conversaciones en los canales que tus clientes prefieren.
- **- ↔️ Constructor de Flujos Visual:** Diseña flujos de conversación complejos sin código. Arrastra, suelta y conecta nodos para crear la lógica perfecta para tus agentes.
- **🎤 Voces Humanas y Multilenguaje:** Elige entre una variedad de voces ultra-realistas de ElevenLabs y configura tus agentes para que hablen en múltiples idiomas.
- **🔌 Integraciones Poderosas:** Conecta con Google Calendar, Sheets, HubSpot, Airtable y más. Envía y recibe datos para enriquecer cada conversación y automatizar tus procesos de negocio.
- **📊 Analítica y Chat en Vivo:** Monitorea el rendimiento de tus agentes con analíticas detalladas y toma el control de las conversaciones cuando sea necesario.
- **📞 Widget de Voz Web:** Añade un botón de llamada inteligente a tu sitio web para capturar leads de forma instantánea y conectarlos con tus agentes de voz.
- **📇 CRM Integrado:** Gestiona contactos, leads y pipelines de venta directamente desde la plataforma.
- **💳 Sistema de Créditos y Suscripciones:** Modelo de precios flexible basado en el uso, gestionado con Lemon Squeezy, que permite a los usuarios comprar créditos y suscribirse a planes.

## 🚀 Stack Tecnológico

KarolAI está construido con un stack moderno y robusto para garantizar escalabilidad y una gran experiencia de desarrollo:

- **Framework:** [Next.js](https://nextjs.org/) (con App Router y Turbopack)
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
- **Base de Datos y ORM:** [PostgreSQL](https://www.postgresql.org/) con [Prisma](https://www.prisma.io/)
- **Autenticación:** [Clerk](https://clerk.com/)
- **UI:** [Tailwind CSS](https://tailwindcss.com/) con [Shadcn/UI](https://ui.shadcn.com/) y [Radix UI](https://www.radix-ui.com/)
- **Gestión de Estado:** [React Query](https://tanstack.com/query/latest)
- **IA de Voz:** [Vapi.ai](https://vapi.ai/), [ElevenLabs](https://elevenlabs.io/)
- **IA de Chat:** [LangChain](https://www.langchain.com/) con modelos de [Anthropic](https://www.anthropic.com/)/[OpenAI](https://openai.com/)
- **Integraciones:** [Nango](https://www.nango.dev/)
- **Pagos y Suscripciones:** [Lemon Squeezy](https://www.lemonsqueezy.com/)
- **Tareas en Segundo Plano:** [BullMQ](https://bullmq.io/) con [Redis](https://redis.io/) (Upstash)
- **Eventos en Tiempo Real:** [Pusher](https://pusher.com/)
- **Almacenamiento de Archivos:** [Cloudinary](https://cloudinary.com/)

## 📂 Estructura del Proyecto

El código está organizado de manera modular para facilitar el mantenimiento y la escalabilidad.

```
karolai/
├── prisma/               # Esquema y migraciones de la base de datos
├── public/               # Activos estáticos
├── src/
│   ├── actions/          # Server Actions de Next.js para la lógica de backend
│   ├── app/              # Rutas, UI y lógica de la aplicación (App Router)
│   │   ├── api/          # Rutas de API para webhooks y endpoints internos
│   │   └── application/  # El núcleo de la aplicación autenticada
│   ├── components/       # Componentes de UI reutilizables
│   ├── hooks/            # Hooks de React personalizados
│   ├── lib/              # Funciones de utilidad y clientes de SDK
│   ├── services/         # Servicios de lógica de negocio
│   └── types/            # Definiciones de tipos y TypeScript
└── ...
```

## ⚙️ Guía de Inicio Rápido

Sigue estos pasos para poner en marcha el proyecto en tu entorno de desarrollo local.

### 1. Prerrequisitos

- [Node.js](https://nodejs.org/en/) (v20 o superior)
- [pnpm](https://pnpm.io/) (recomendado), `npm` o `yarn`
- Una instancia de [PostgreSQL](https://www.postgresql.org/download/) en ejecución
- Acceso a las claves de API de los servicios de terceros mencionados en el stack.

### 2. Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/karolai.git
    cd karolai
    ```

2.  **Instala las dependencias:**
    ```bash
    pnpm install
    ```

### 3. Configuración del Entorno

1.  Crea un archivo `.env` en la raíz del proyecto copiando el ejemplo:
    ```bash
    cp .env.example .env
    ```

2.  Rellena el archivo `.env` con tus propias claves y configuraciones.

    ```env
    # Base de Datos
    DATABASE_URL="postgresql://user:password@host:port/database"

    # Autenticación - Clerk
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
    CLERK_SECRET_KEY=
    # ... otras variables de Clerk (sign-in, sign-up urls)

    # URLs de la aplicación
    NEXT_PUBLIC_BASE_URL="http://localhost:3000"
    NEXT_PUBLIC_APP_URL="http://localhost:3000"

    # Servicios de IA (Voz y Chat)
    VAPI_API_KEY=
    NEXT_PUBLIC_VAPI_API_KEY=
    ELEVENLABS_API_KEY=
    NEXT_PUBLIC_ANTHROPIC_API_KEY=

    # WhatsApp / Meta
    NEXT_PUBLIC_META_APP_ID=
    META_APP_SECRET=
    META_SYSTEM_USER_TOKEN=
    NEXT_PUBLIC_META_CONFIG_ID=
    WHATSAPP_API_VERSION="v19.0"

    # Pagos - Lemon Squeezy
    LEMON_SQUEEZY_API_KEY=
    LEMON_SQUEEZY_STORE_ID=
    LEMON_SQUEEZY_WEBHOOK_SECRET=
    PLAN_CREDIT_VARIANTS=
    CREDIT_PACK_VARIANTS=

    # Integraciones
    NANGO_SECRET_KEY=
    NANGO_CONNECT_SESSION_TOKEN= # Opcional, dependiendo de la configuración
    PDL_API_KEY=

    # Tiempo Real - Pusher
    PUSHER_APP_ID=
    PUSHER_KEY=
    PUSHER_SECRET=
    PUSHER_CLUSTER=
    NEXT_PUBLIC_PUSHER_KEY=
    NEXT_PUBLIC_PUSHER_CLUSTER=

    # Upstash Redis (para BullMQ)
    NEXT_PUBLIC_UPSTASH_REDIS_REST_URL=
    NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN=

    # Cloudinary
    CLOUDINARY_CLOUD_NAME=
    CLOUDINARY_API_KEY=
    CLOUDINARY_API_SECRET=
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
    NEXT_PUBLIC_CLOUDINARY_API_KEY=
    NEXT_PUBLIC_CLOUDINARY_SECRET=
    ```

### 4. Base de Datos

Aplica las migraciones de Prisma para configurar el esquema de tu base de datos:

```bash
pnpm prisma db push
```

### 5. Iniciar el Servidor de Desarrollo

Ahora puedes iniciar la aplicación:

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador y ¡listo!

## 📜 Licencia

Este proyecto está distribuido bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.
