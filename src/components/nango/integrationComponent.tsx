"use client";

import {
  ConnectionExists,
  createConnection,
  getSessionToken,
} from "@/actions/nango";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useEffect, useState } from "react";
import { onBoardUser } from "@/actions/user";
import Nango from "@nangohq/frontend";
import {
  Calendar,
  CheckCircle,
  Shield,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import GoogleActions from "../integrations/google-actions";

const IntegrationComponent = ({
  setIntegrationConnection,
  visibleName,
  providerConfigKey,
  authMode,
  nodeId,
  updateNode,
  selectedNode
}: {
  setIntegrationConnection: (isConnected: boolean) => void;
  visibleName: string;
  providerConfigKey: string;
  authMode: string;
  nodeId: string;
  updateNode: (nodeId: string, updates: any) => void;
  selectedNode: any
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jsonData, setJsonData] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);

  const handleConnect = async () => {
    toast("Asegurate de no bloquear las ventanas emergentes. Si no lo haces, no se podrá conectar con la aplicación.")
    try {
      setIsLoading(true);
      setError(null);

      const user = await onBoardUser();
      if (!user) {
        throw new Error("Usuario no encontrado");
      }

      const sessionToken = await getSessionToken(user?.data.id);
      if (!sessionToken) {
        throw new Error("Error al obtener el token de sesión");
      }

      const nango = new Nango({
        connectSessionToken:
          typeof sessionToken === "string" ? sessionToken : sessionToken.token,
      });

      const result = await nango.auth(providerConfigKey);
      if (result.isPending === false) {
        const connection = await createConnection({
          authMode: authMode,
          endUserId: user?.data.id,
          integrationId: result.connectionId,
          providerConfigKey: result.providerConfigKey,
        });

        setIsConnected(true);
        console.log("Conexión creada:", connection);
        setConnectionId(connection.id);
      }
      
    } catch (error) {
      console.error(`Error conectando con ${visibleName}:`, error);
      setError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyConnectionExists = async () => {
    try {
      const user = await onBoardUser();
      if (!user) {
        throw new Error("Usuario no encontrado");
      }

      setUserId(user?.data.id);

      const sessionToken = await getSessionToken(user?.data.id);
      if (!sessionToken) {
        throw new Error("Error al obtener el token de sesión");
      }

      const connection = await ConnectionExists(
        user?.data.id,
        providerConfigKey
      );
      setConnectionId(connection.connection?.id || null);
      setIsConnected(connection.isConnected);
      setIntegrationConnection(connection.isConnected);
    } catch (error) {
      console.error("Error verificando conexión:", error);
      setError("Error al verificar la conexión");
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    verifyConnectionExists();
  }, []);

  // Estado de carga inicial
  if (isInitialLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-600">Verificando conexión...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estado conectado
  if (isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto border-green-200 bg-green-50/50">
        <CardContent className="pt-0">
          <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg border border-green-200">
            <Calendar className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              {visibleName}
            </span>
          </div>
          {providerConfigKey === "google-calendar" && (
            <GoogleActions setJsonData={setJsonData} userId={userId} connectionId={connectionId} nodeId={nodeId} updateNode={updateNode} selectedNode={selectedNode} />
          )}
        </CardContent>
      </Card>
    );
  }

  // Estado no conectado
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
          <Calendar className="h-6 w-6 text-blue-600" />
        </div>
        <CardDescription className="text-gray-600">
          Necesitamos permisos para acceder a tu {visibleName} y poder
          gestionarlo.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-amber-800">
                Permisos Requeridos
              </h4>
              <p className="text-xs text-amber-700">
                Solo accederemos a la información necesaria para sincronizar tu{" "}
                {visibleName}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-red-800">
                  Error de Conexión
                </h4>
                <p className="text-xs text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleConnect}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Conectando...
            </>
          ) : (
            <>
              <Calendar className="mr-2 h-4 w-4" />
              Conectar con {visibleName}
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Al conectar, aceptas que podamos acceder a tu {visibleName}. Asegurate de no bloquear las ventanas emergentes. Si no lo haces, no se podrá conectar con la aplicación.
        </p>
      </CardContent>
    </Card>
  );
};

export default IntegrationComponent;
