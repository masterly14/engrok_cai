# Integración con Vapi AI

Esta documentación explica cómo configurar y usar la integración con Vapi AI para workflows de voz.

## Configuración

### 1. Variables de Entorno

Agrega la siguiente variable de entorno a tu archivo `.env`:

```bash
VAPI_API_KEY=tu_api_key_de_vapi
```

Puedes obtener tu API key desde el [Dashboard de Vapi](https://dashboard.vapi.ai).

### 2. Migración de Base de Datos

La integración requiere campos adicionales en la tabla `Workflow`. Ejecuta la migración:

```bash
npx prisma migrate dev --name add_vapi_workflow_fields
```

## Funcionalidades

### Sincronización Automática

Cuando guardas un workflow en el editor, automáticamente se:

1. **Guarda localmente** en tu base de datos
2. **Envía a Vapi AI** para crear/actualizar el workflow en su plataforma
3. **Almacena el ID de Vapi** para futuras referencias

### Estados de Sincronización

El toolbar muestra el estado de sincronización:

- 🟢 **Sincronizado con Vapi**: El workflow existe en Vapi AI
- 🔴 **No sincronizado**: El workflow solo existe localmente
- 🔄 **Verificando**: Comprobando el estado de sincronización

### Tipos de Nodos Soportados

La integración soporta los siguientes tipos de nodos:

- **Conversation**: Nodos de conversación con prompts y extracción de variables
- **API Request**: Llamadas a APIs externas
- **Transfer Call**: Transferencias de llamada a números específicos
- **End Call**: Finalización de llamadas
- **Integration**: Integraciones con servicios externos (Google Sheets, Calendar, etc.)

## API Endpoints

### Crear/Actualizar Workflow

```typescript
POST /api/workflows
{
  "name": "Mi Workflow",
  "workflowJson": { /* datos del editor */ },
  "vapiPayload": { /* payload para Vapi AI */ }
}
```

### Sincronizar Workflow Existente

```typescript
POST /api/workflows/[id]/sync
```

## Manejo de Errores

### Errores de Vapi API

Si hay un error al comunicarse con Vapi AI:

1. El workflow se guarda localmente
2. Se muestra una advertencia al usuario
3. Se registra el error en la consola
4. El usuario puede intentar sincronizar manualmente

### Errores Comunes

- **VAPI_API_KEY no configurada**: Verifica que la variable de entorno esté definida
- **Error de red**: Verifica la conectividad a internet
- **Payload inválido**: Verifica que el workflow tenga nodos válidos

## Uso en Producción

### Configuración Recomendada

1. **API Key de Producción**: Usa una API key de producción de Vapi
2. **Monitoreo**: Implementa logging para monitorear errores de sincronización
3. **Retry Logic**: Considera implementar reintentos automáticos para fallos temporales

### Limitaciones

- Los workflows deben tener al menos un nodo de conversación
- Los nodos `endCall` son recomendados para evitar llamadas infinitas
- Las variables extraídas deben tener tipos válidos (string, number, boolean)

## Troubleshooting

### Workflow no se sincroniza

1. Verifica que `VAPI_API_KEY` esté configurada
2. Revisa los logs del servidor para errores
3. Verifica que el workflow tenga nodos válidos
4. Intenta sincronizar manualmente

### Error de autenticación

1. Verifica que la API key sea válida
2. Asegúrate de que la cuenta de Vapi tenga créditos disponibles
3. Verifica que la API key tenga permisos para crear workflows

### Workflow no funciona en Vapi

1. Verifica que todos los nodos sean compatibles
2. Asegúrate de que las condiciones de los edges sean válidas
3. Revisa la documentación de Vapi para requisitos específicos

## Recursos Adicionales

- [Documentación de Vapi AI](https://docs.vapi.ai/)
- [API Reference de Vapi](https://docs.vapi.ai/api-reference)
- [Ejemplos de Workflows](https://docs.vapi.ai/workflows/examples) 