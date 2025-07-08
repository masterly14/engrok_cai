import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import {
  MessageSquare,
  CornerDownRight,
  Mic,
  ArrowRight,
  PlayCircle,
  FileIcon,
  Info,
  Loader2,
} from "lucide-react";

// Definimos el tipo para los botones para mayor claridad
interface InteractiveButton {
  id: string;
  title: string;
}

interface ConversationNodeProps {
  name?: string;
  botResponse?: string;
  templateBody?: string;
  templateCategory?: string;
  templateLanguage?: string;
  interactiveButtons?: InteractiveButton[];
  responseType?: "text" | "audio" | "template";
  audioUrl?: string;
  fileOrImageUrl?: string;
  isUploadingMedia?: boolean;
  jumpToNextNode?: boolean;
  initialMessage?: boolean;
}

const ConversationNode = ({ data }: NodeProps<ConversationNodeProps>) => {
  const buttons = data.interactiveButtons || [];
  const isAudioResponse = data.responseType === "audio";
  const isTemplateResponse = data.responseType === "template";

  const renderMediaPreview = () => {
    if (!data.fileOrImageUrl && !data.isUploadingMedia) return null;

    if (data.isUploadingMedia) {
      return (
        <div className="mb-2 flex items-center justify-center gap-2 p-2 bg-white/90 rounded-lg border border-gray-200">
          <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
          <span className="text-sm text-gray-700">
            Cargando previsualización...
          </span>
        </div>
      );
    }

    // Check if it's an image
    if (
      data &&
      data.fileOrImageUrl &&
      data.fileOrImageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    ) {
      return (
        <div className="mb-2 rounded-lg overflow-hidden flex justify-center">
          <img
            src={data.fileOrImageUrl || "/placeholder.svg"}
            alt="Media preview"
            className="w-full h-auto rounded-lg"
          />
        </div>
      );
    }

    // Check if it's a video
    if (
      data &&
      data.fileOrImageUrl &&
      data.fileOrImageUrl.match(/\.(mp4|webm|ogg)$/i)
    ) {
      return (
        <div className="mb-2 rounded-lg overflow-hidden flex justify-center">
          <video
            src={data.fileOrImageUrl}
            controls
            className="w-full h-auto rounded-lg"
            controlsList="nodownload"
          />
        </div>
      );
    }

    // For other file types
    return (
      <div className="mb-2 flex items-center justify-center gap-2 p-2 bg-white/90 rounded-lg border border-gray-200">
        <FileIcon className="w-5 h-5 text-gray-600" />
        <span className="text-sm text-gray-700">Archivo adjunto</span>
      </div>
    );
  };

  return (
    <div
      className="relative w-80 p-4 rounded-lg border border-green-400"
      style={{
        backgroundImage: "url('/whatsapp-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* WhatsApp-style message bubble */}
      <div className="relative">
        {/* info */}
        <div className="flex mb-4 items-center gap-1 text-xs text-green-600 font-medium px-2 py-1 bg-green-100 rounded-full">
          <Info className="w-3 h-3" />
          <span>
            Esta es una previsualización de como se verá el mensaje en WhatsApp.
            Esta sujeta a sutiles cambios visuales.
          </span>
        </div>

        {/* Bot name/title */}
        {data.name && (
          <div className="mb-2 flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {data.name}
            </span>

            {data.initialMessage && (
              <div className="flex items-center gap-1 text-xs text-green-600 font-medium px-2 py-1 bg-green-100 rounded-full">
                <PlayCircle className="w-3 h-3" />
                <span>Inicio</span>
              </div>
            )}
          </div>
        )}

        {/* Message bubble */}
        <div className="relative max-w-xs">
          <div className="bg-white rounded-lg rounded-tl-sm shadow-sm p-3 relative">
            {/* Message tail */}
            <div className="absolute -left-2 top-0 w-0 h-0 border-r-8 border-r-white border-t-8 border-t-transparent"></div>

            {isAudioResponse ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mic className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Mensaje de voz</span>
                </div>
                {data.audioUrl && (
                  <audio
                    src={data.audioUrl}
                    controls
                    className="w-full"
                    controlsList="nodownload"
                  />
                )}
              </div>
            ) : (
              <div>
                {renderMediaPreview()}
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {data.templateBody
                    ? data.templateBody
                    : data.botResponse || "Configura la respuesta del bot..."}
                </p>

                {/* Category & language badges */}
                {data.templateCategory && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full capitalize">
                      {data.templateCategory.toLowerCase()}
                    </span>
                    {data.templateLanguage && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">
                        {data.templateLanguage}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Message time */}
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-500">
                {new Date().toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          {/* Jump to next node indicator */}
          {data.jumpToNextNode && (
            <div className="mt-2 flex items-center gap-2 text-blue-600 bg-blue-50 p-2 rounded-lg">
              <ArrowRight className="w-4 h-4" />
              <span className="text-xs font-medium">
                Continúa automáticamente
              </span>
            </div>
          )}

          {/* Interactive buttons */}
          {!data.jumpToNextNode && buttons.length > 0 && (
            <div className="mt-0.5 space-y-0.5 flex flex-col items-center">
              {buttons.map((button, index) => (
                <div key={button.id} className="relative w-full">
                  <div className="bg-white border border-green-200 rounded-lg p-3 hover:bg-green-50 transition-colors cursor-pointer shadow-sm">
                    <div className="flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-800 text-center">
                        {button.title}
                      </span>
                      <CornerDownRight className="w-4 h-4 text-green-600 ml-2" />
                    </div>
                  </div>

                  <Handle
                    type="source"
                    position={Position.Right}
                    id={button.id}
                    className="!w-3 !h-3 !bg-green-500 !border-2 !border-white !shadow-md !-right-1"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white !shadow-md"
      />

      {(buttons.length === 0 || data.jumpToNextNode) && (
        <Handle
          type="source"
          position={Position.Right}
          id="default-source"
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white !shadow-md"
        />
      )}
    </div>
  );
};

export default memo(ConversationNode);
