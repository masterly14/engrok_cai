"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditDisplay } from "@/components/application/sidebar/credit-display";

interface LedgerEntry {
  id: string;
  delta: number;
  type: string;
  meta: any;
  createdAt: string;
}

export default function CreditsPage() {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [initialCredits, setInitialCredits] = useState<number>(0);

  useEffect(() => {
    const load = async () => {
      try {
        const res1 = await fetch("/api/credits/balance").then((r) => r.json());
        setBalance(res1.credits ?? 0);
        
        // Obtener los créditos iniciales del usuario
        const res3 = await fetch("/api/user/credits").then((r) => r.json());
        setInitialCredits(res3.initialAmountCredits ?? 0);
        
        const res2 = await fetch("/api/credits/ledger?take=100").then((r) =>
          r.json(),
        );
        setLedger(res2.data ?? []);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-slate-800">Créditos</h1>

        {/* Balance actual */}
        <CreditDisplay
          amount={balance}
          maxAmount={initialCredits}
          className="w-full"
        />

        {/* Histórico */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium text-slate-700">
              Movimientos recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-2 pr-4">Fecha</th>
                    <th className="py-2 pr-4">Tipo</th>
                    <th className="py-2 pr-4">Créditos</th>
                    <th className="py-2">Meta</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 whitespace-nowrap">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 pr-4 capitalize">{row.type}</td>
                      <td className="py-2 pr-4 font-mono">
                        {row.delta > 0 ? "+" : ""}
                        {row.delta}
                      </td>
                      <td className="py-2 text-xs max-w-[200px] truncate">
                        {row.meta ? JSON.stringify(row.meta) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
