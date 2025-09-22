/**
 * Script para sincronizar User.amountCredits con Subscription.currentCredits
 * Ejecutar una sola vez para corregir datos desincronizados existentes
 */

import { db } from "@/utils";

export async function syncUserCredits() {
  console.log("🔄 Iniciando sincronización de créditos de usuarios...");

  try {
    // Obtener todos los usuarios con suscripciones activas
    const usersWithSubs = await db.user.findMany({
      where: {
        subscriptions: {
          some: {
            status: { in: ["ACTIVE", "TRIALING"] },
            isPaused: false,
          },
        },
      },
      include: {
        subscriptions: {
          where: {
            status: { in: ["ACTIVE", "TRIALING"] },
            isPaused: false,
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    console.log(`📊 Encontrados ${usersWithSubs.length} usuarios con suscripciones activas`);

    let syncedCount = 0;
    let errorCount = 0;

    for (const user of usersWithSubs) {
      try {
        const subscription = user.subscriptions[0];
        if (!subscription) continue;

        const currentUserCredits = user.amountCredits;
        const currentSubCredits = subscription.currentCredits;

        // Solo actualizar si hay diferencia
        if (currentUserCredits !== currentSubCredits) {
          console.log(
            `👤 Usuario ${user.id}: User.amountCredits=${currentUserCredits} → Subscription.currentCredits=${currentSubCredits}`
          );

          await db.user.update({
            where: { id: user.id },
            data: { amountCredits: currentSubCredits },
          });

          syncedCount++;
        }
      } catch (error) {
        console.error(`❌ Error sincronizando usuario ${user.id}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Sincronización completada:`);
    console.log(`   - Usuarios sincronizados: ${syncedCount}`);
    console.log(`   - Errores: ${errorCount}`);
    console.log(`   - Total procesados: ${usersWithSubs.length}`);

  } catch (error) {
    console.error("❌ Error durante la sincronización:", error);
    throw error;
  }
}

// Función para ejecutar desde línea de comandos
if (require.main === module) {
  syncUserCredits()
    .then(() => {
      console.log("🎉 Script ejecutado exitosamente");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Error ejecutando script:", error);
      process.exit(1);
    });
}
