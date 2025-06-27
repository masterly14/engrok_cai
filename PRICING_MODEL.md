# Modelo de Pricing – Engrok CAI

> Última actualización: {{fecha}}

---

## Resumen de planes

| Plan | Precio (USD / usuario / mes) | Créditos incluidos | Equivalente* | Límites principales | Exceso de uso |
|------|------------------------------|--------------------|--------------|---------------------|---------------|
| **Trial 14 d** | 0 | 600 | 55 min voz **o** 120 conv. WA | 1 agente voz, 1 agente chat, 1 widget, 500 contactos CRM | Bloqueo al agotar créditos |
| **Starter** | 29 | 3 000 | 275 min **o** 600 conv. | • 2 agentes voz  
• 2 agentes chat  
• 1 widget  
• 5 000 contactos  
• 5 workflows | 0,15 USD/min  
0,07 USD/conv. |
| **Growth** | 79 | 10 000 | 900 min **o** 2 000 conv. | • 5 agentes voz  
• 5 agentes chat  
• 3 widgets  
• contactos ilimitados  
• API & Webhooks  
• IA analytics | 0,13 USD/min  
0,06 USD/conv. |
| **Scale** | 199 | 30 000 | 2 700 min **o** 6 000 conv. | • agentes & widgets ilimitados  
• workflows ilimitados  
• white-label widget  
• SLA 99,9 % | 0,11 USD/min  
0,05 USD/conv. |
| **Enterprise** | Custom | Custom | Custom | Instancia dedicada, SSO, soporte 24/7, facturación anual, contrato SLA | Tarifas negociadas |

\*El usuario puede combinar libremente minutos de voz (11 cr/min) y conversaciones WhatsApp (5 cr/conv. desde la #1001). El equivalente es sólo orientativo.

---

## Conversión de créditos

```
1 crédito = 0,01 USD de coste directo (voz + WhatsApp)
```

* **Voz (Vapi):** 0,11 USD/min  → 11 cr/min.
* **WhatsApp:** primeras 1 000 conv/mes sin cargo. A partir de ahí Meta cobra ~0,05 USD → 5 cr/conv.

Los créditos mensuales se recargan al inicio de cada ciclo de facturación. Los créditos comprados como _add-ons_ nunca expiran.

---

## Límite y control de recursos

| Recurso | Chequeo               | Cómo se aplica |
|---------|-----------------------|----------------|
| Créditos | `amountCredits`       | Débito al cerrar llamada o abrir conversación WA >1000 |
| Agentes de voz | `checkPlanRestrictions('voiceAgents')` | Bloquea creación si excede plan |
| Widgets | `checkPlanRestrictions('widgets')` | Igual que arriba |
| Contactos CRM | Límite sólo en Starter | Usa un _count_ rápido en la tabla `Lead` |
| Workflows | idem widgets | |

---

## Costos de infraestructura (supuestos)

| Componente | Tarifa | Prorrateo por usuario Starter | Fuente |
|------------|--------|------------------------------|--------|
| Vapi minutos | 0,11 USD/min | variable | docs Vapi |
| WhatsApp conversations | 0,05 USD/conv. (después de 1 000) | variable | Meta pricing |
| Neon DB | 0,30 USD / hora-CPU | 1 USD | internal benchmark |
| Upstash Redis | 0,20 USD / M comandos | 0,5 USD | upstash.com |
| Fly.io worker | 7 USD / mes (512 MB) | 0,5 USD | fly.io |
| Vercel (Pro) | 20 USD base + ejec. | 0,5 USD | vercel.com |

Total infra aprox. Starter: **2 USD** fijos + uso variable (créditos).

---

## Margen estimado

| Plan | Ingreso | Coste créditos (supone uso 100 %) | Coste infra fijo | Margen USD | Margen % |
|------|---------|----------------------------------|------------------|------------|----------|
| Starter | 29 USD | 30 USD × 0,01 = 30 ⇒ **30 USD** | 2 USD | **-3 USD**¹ | — |
| Growth | 79 USD | 100 USD | 4 USD | **-25 USD** | — |
| Scale  | 199 USD | 300 USD | 8 USD | **-109 USD** | — |

¹En la práctica los usuarios rara vez consumen el 100 % de sus créditos; con una media de uso del 60 % el margen se sitúa en ~20 % para todos los planes.

---

## Overage y paquetes de recarga

* Overage: se cobra al vuelo vía Stripe _metered_:  
  • 0,17 USD/min voz  
  • 0,07 USD/conv WhatsApp
* Paquetes:  
  – **+5 000 créditos** → 60 USD (0,012 USD/cr.)  
  – **+20 000 créditos** → 200 USD (0,010 USD/cr.)

---

## Ciclo de facturación y reposición de créditos

1. Se ejecuta el cron `reset-credits` a las 00:00 UTC del día 1.  
2. `amountCredits ← initialAmountCredits + rolloverPagados`.  
3. Créditos pagados no usados permanecen; los promocionales se descartan.

---

## Roadmap pricing

| Feature futuro | Impacto en plan | ETA |
|----------------|-----------------|-----|
| SMS channel | Add-on (2 cr/msg) | Q4-25 |
| Transcripción IA | 1 cr / min audio | Q1-26 |
| Multi-tenant white-label | Solo Enterprise | Q4-25 | 