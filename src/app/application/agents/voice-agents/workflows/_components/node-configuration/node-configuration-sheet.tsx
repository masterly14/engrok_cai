import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Node } from "reactflow";
import { ConversationNodeConfig } from "./conversation-node-config";
import { TransferCallNodeConfig } from "./transfer-call-node-config";
import { EndCallNodeConfig } from "./end-call-node-config";
import { IntegrationNodeConfig } from "./integration-node-config";
import { ApiRequestNodeConfig } from "./api-request-node-config";
import { VapiVoice } from "../../types";

interface NodeConfigurationSheetProps {
  selectedNode: Node | null;
  isOpen: boolean;
  onClose: () => void;
  updateNode: (nodeId: string, updates: any) => void;
  globalVoice: VapiVoice;
  setGlobalVoice: (voice: VapiVoice) => void;
  isFirstConversation: boolean;
}

export function NodeConfigurationSheet({
  selectedNode,
  isOpen,
  onClose,
  updateNode,
  globalVoice,
  setGlobalVoice,
  isFirstConversation,
}: NodeConfigurationSheetProps) {
  if (!selectedNode) return null;

  const renderNodeConfiguration = () => {
    switch (selectedNode.type) {
      case "conversation":
        return (
          <ConversationNodeConfig
            selectedNode={selectedNode}
            updateNode={updateNode}
            globalVoice={globalVoice}
            setGlobalVoice={setGlobalVoice}
            isFirstConversation={isFirstConversation}
          />
        );
      case "transferCall":
        return (
          <TransferCallNodeConfig
            selectedNode={selectedNode}
            updateNode={updateNode}
            globalVoice={globalVoice}
            setGlobalVoice={setGlobalVoice}
          />
        );
      case "endCall":
        return (
          <EndCallNodeConfig
            selectedNode={selectedNode}
            updateNode={updateNode}
            globalVoice={globalVoice}
            setGlobalVoice={setGlobalVoice}
          />
        );
      case "integration":
        return (
          <IntegrationNodeConfig
            selectedNode={selectedNode}
            updateNode={updateNode}
            globalVoice={globalVoice}
            setGlobalVoice={setGlobalVoice}
          />
        );
      case "apiRequest":
        return (
          <ApiRequestNodeConfig
            selectedNode={selectedNode}
            updateNode={updateNode}
            globalVoice={globalVoice}
            setGlobalVoice={setGlobalVoice}
          />
        );
      default:
        return (
          <div className="p-4 text-center text-gray-500">
            Configuración no disponible para este tipo de nodo
          </div>
        );
    }
  };
  console.log(selectedNode);
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-[90vw] sm:max-w-md overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Configurar nodo – {selectedNode.data.label}</SheetTitle>
          <div className="text-sm text-gray-500">
            Tipo de Nodo: {selectedNode.type}
          </div>
        </SheetHeader>

        {renderNodeConfiguration()}
      </SheetContent>
    </Sheet>
  );
}
