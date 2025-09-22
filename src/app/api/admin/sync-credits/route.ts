import { NextResponse } from "next/server";
import { db } from "@/utils";

/**
 * Endpoint para sincronizar User.amountCredits con Subscription.currentCredits
 * Solo para uso administrativo
 */
export async function POST() {
  try {
    console.log("🔄 Iniciando sincronización de créditos de usuarios...");

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
    const errors: string[] = [];

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
        const errorMsg = `Error sincronizando usuario ${user.id}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
        errorCount++;
      }
    }

    const result = {
      success: true,
      message: "Sincronización completada",
      stats: {
        totalUsers: usersWithSubs.length,
        syncedUsers: syncedCount,
        errors: errorCount,
        errorDetails: errors,
      },
    };

    console.log(`✅ Sincronización completada:`, result.stats);

    return NextResponse.json(result);

  } catch (error) {
    console.error("❌ Error durante la sincronización:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error durante la sincronización",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
