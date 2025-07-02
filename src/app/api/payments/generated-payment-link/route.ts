import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      amount_in_cents,
      currency,
      sku,
      redirect_url,
      expires_at,
      wompi_private_key,
      collect_shipping,
    } = body;

    if (
      !amount_in_cents ||
      !currency ||
      !redirect_url ||
      !wompi_private_key ||
      !name ||
      !description ||
      collect_shipping === undefined
    ) {
      return NextResponse.json(
        { error: "Faltan campos requeridos." },
        { status: 400 }
      );
    }

    // Seleccionar entorno (sandbox vs producción) según prefijo de la llave
    const isTestKey = typeof wompi_private_key === "string" && wompi_private_key.startsWith("prv_test_");
    const wompiUrl = isTestKey
      ? "https://sandbox.wompi.co/v1/payment_links"
      : "https://production.wompi.co/v1/payment_links";

    const response = await fetch(wompiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${wompi_private_key}`,
      },
      body: JSON.stringify({
        "name": name,
        "description": description,
        "amount_in_cents": amount_in_cents,
        "currency": currency,
        "sku": sku,
        "collect_shipping": collect_shipping,
        "redirect_url": redirect_url,
        "single_use": true,
        "expires_at": expires_at,
        "customer_data": {
            "customer_references": [
                {
                    "label": "Orden ID",
                    "is_required": true,
                },
            ]
        },
      }),
    });

    const data = await response.json();

    console.log(response);
    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data.message || "Error desconocido al crear el enlace de pago.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error al crear el link de pago:", error);
    return NextResponse.json(
      { error: "Error al crear el link de pago." },
      { status: 500 }
    );
  }
}
