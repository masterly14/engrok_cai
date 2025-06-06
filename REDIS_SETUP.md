# 🚀 Configuración de Redis para Vercel

## 📋 Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env` y a tu proyecto de Vercel:

```bash
# Redis Configuration
REDIS_URL="your_redis_connection_string"

# Optional: Queue Configuration
QUEUE_CONCURRENCY=3
QUEUE_MAX_RETRIES=3
QUEUE_RETRY_DELAY=2000
```

## ☁️ Proveedores de Redis Recomendados para Vercel

### 1. **Upstash Redis** (Recomendado - Serverless)

✅ **Optimizado para serverless**
✅ **Tier gratuito disponible**
✅ **Auto-scaling**

```bash
# Ejemplo de REDIS_URL para Upstash
REDIS_URL="rediss://default:your_password@your_endpoint.upstash.io:6380"
```

**Configuración:**
1. Ir a [upstash.com](https://upstash.com)
2. Crear una cuenta
3. Crear una nueva base de datos Redis
4. Copiar la URL de conexión

### 2. **Railway Redis**

✅ **Fácil configuración**
✅ **Good performance**
✅ **Pay-as-you-go**

```bash
# Ejemplo de REDIS_URL para Railway
REDIS_URL="redis://default:password@hostname.railway.app:port"
```

### 3. **Redis Cloud**

✅ **Managed Redis**
✅ **High availability**
✅ **Global distribution**

```bash
# Ejemplo de REDIS_URL para Redis Cloud
REDIS_URL="rediss://default:password@hostname.redis.cloud:port"
```

## 🔧 Configuración en Vercel

1. **En tu dashboard de Vercel:**
   - Ve a Settings → Environment Variables
   - Agrega `REDIS_URL` con tu string de conexión

2. **Para desarrollo local:**
   ```bash
   # .env.local
   REDIS_URL="redis://localhost:6379"  # Si tienes Redis local
   # O usa el mismo URL de producción para testing
   ```

## 🧪 Testing de la Configuración

### Verificar conexión Redis:

```bash
# Hacer request a tu API de health check
curl https://tu-app.vercel.app/api/worker/process-queue
```

Deberías ver una respuesta como:
```json
{
  "health": {
    "status": "healthy",
    "details": {
      "redis": "connected",
      "queue": { "waiting": 0, "active": 0 },
      "worker": "running"
    }
  }
}
```

## 🚨 Troubleshooting

### Error: "Failed to connect to Redis"
- ✅ Verifica que `REDIS_URL` esté correctamente configurada
- ✅ Asegúrate que tu proveedor Redis permita conexiones externas
- ✅ Verifica firewall/security groups

### Error: "Worker not running"
- ✅ Hacer POST request a `/api/worker/process-queue` para inicializar
- ✅ Verificar logs de Vercel para errores específicos

### Mensajes no se procesan:
- ✅ Verificar que el webhook llame correctamente al endpoint
- ✅ Revisar métricas de Redis para ver si los jobs se están encolando
- ✅ Verificar logs del worker

## 📊 Monitoreo

### Endpoints de monitoreo disponibles:

- `GET /api/worker/process-queue` - Health check y status
- `PUT /api/worker/process-queue` - Control manual (pause/resume/clean)

### Acciones disponibles:

```bash
# Pausar la cola
curl -X PUT https://tu-app.vercel.app/api/worker/process-queue \
  -H "Content-Type: application/json" \
  -d '{"action": "pause"}'

# Reanudar la cola
curl -X PUT https://tu-app.vercel.app/api/worker/process-queue \
  -H "Content-Type: application/json" \
  -d '{"action": "resume"}'

# Limpiar trabajos completados
curl -X PUT https://tu-app.vercel.app/api/worker/process-queue \
  -H "Content-Type: application/json" \
  -d '{"action": "clean"}'

# Reintentar trabajos fallidos
curl -X PUT https://tu-app.vercel.app/api/worker/process-queue \
  -H "Content-Type: application/json" \
  -d '{"action": "retry"}'
```

## ⚡ Optimizaciones para Producción

### 1. **Connection Pooling**
El sistema ya está optimizado con:
- Lazy connections
- Connection reuse
- Timeout configurations

### 2. **Queue Management**
- Auto-retry con exponential backoff
- Job deduplication por ID
- Cleanup automático de jobs antiguos

### 3. **Monitoring**
- Health checks automáticos
- Métricas en tiempo real
- Error tracking y recovery

## 🔗 Enlaces Útiles

- [Upstash Documentation](https://docs.upstash.com/)
- [Railway Redis Guide](https://docs.railway.app/databases/redis)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables) 