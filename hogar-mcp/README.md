# hogar-mcp

Servidor MCP del hogar: alacena, facturas y gastos compartidos, manejado desde
Claude y ChatGPT. El backend no llama a ninguna IA: valida y guarda.

**Estado: prueba 0.** Tres tools (`whoami`, `leave_note`, `read_notes`) para
comprobar que cada uno se conecta con su propia identidad y que lo que escribe
uno lo lee el otro.

## Estructura

```
app/mcp/[token]/route.ts   Punto de entrada MCP (Streamable HTTP, sin estado)
lib/mcp/server.ts          Tools MCP: adaptador delgado sobre el dominio
lib/domain/                Reglas de negocio (aquí vive la lógica, no en las tools)
lib/db.ts                  Cliente Postgres (postgres.js)
lib/auth.ts                Generación y hash de tokens
db/migrations/             SQL versionado
scripts/                   migrate y user:add
```

La persona conectada sale del token de la URL. Ninguna tool recibe "quién soy"
como parámetro.

## Puesta en marcha

### 1. Supabase

1. Crea un proyecto (región París, `eu-west-3`, o la más cercana).
2. **Connect** → copia la cadena **Transaction pooler** (puerto 6543).
3. Cambia `[YOUR-PASSWORD]` por la contraseña de la base.

### 2. Local

```bash
npm install
cp .env.example .env.local      # pega DATABASE_URL
npm run db:migrate
```

### 3. Vercel

1. Sube el repo a GitHub e impórtalo en Vercel.
2. Variable de entorno: `DATABASE_URL` (la misma de arriba).
3. Despliega y apunta la URL pública (`https://<algo>.vercel.app`).

### 4. Usuarios

Pon esa URL en `APP_URL` dentro de `.env.local` y:

```bash
npm run user:add -- martin
npm run user:add -- juanjo
```

Cada comando imprime una URL de conector. Solo se muestra una vez (en la base
se guarda el hash). Mándale la suya a Juanjo por privado.

Si una URL se filtra, vuelve a ejecutar `user:add` con el mismo nombre: genera
una nueva y la anterior deja de funcionar.

### 5. Conectar los asistentes

**Claude** (cualquier plan): Customize → Connectors → **+ Add** → *Add custom
connector* → pega la URL → Authentication: **No sign in**. En el chat, actívalo
desde **+** → Connectors.

**ChatGPT** (Plus o superior, en la web): Settings → Apps → Advanced settings →
activa **Developer mode**. Luego **Create app** → pega la URL → autenticación
**No Authentication**. En el chat, elige *Developer mode* en el menú **+** y
selecciona la app.

### 6. La prueba

1. Desde Claude: *"¿con quién estoy conectado en hogar-mcp?"* → debe decir `martin`.
2. Desde Claude: *"deja una nota en el hogar: hola Juanjo"*.
3. Desde ChatGPT: *"lee las notas del hogar"* → debe aparecer la nota firmada por `martin`.
4. Repetir al revés, y una vez desde el móvil.

Si los cuatro pasos funcionan, la base del proyecto está validada.

## Seguridad

- La URL del conector equivale a una contraseña: no la pegues en chats ni la subas al repo.
- Un token inválido responde 404, sin más información.
- Las tablas tienen RLS activado y sin políticas, así que la API REST de
  Supabase no las expone. El servidor se conecta como dueño de las tablas.
- Las tools de lectura llevan `readOnlyHint`. ChatGPT trata las demás como
  escritura y pide confirmación; Claude pide permiso por tool.

## Próximo paso (v1)

Migración `0002`: `items`, `item_events`, `purchases`, `purchase_lines` y
`settlements`. Primero las tools de alacena, luego compras y luego balance.
Las notas de la prueba 0 se eliminan en esa migración.
