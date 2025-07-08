import { PdfViewer } from "./pdf_viewer";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default function CapsulePdfViewer() {
  return (
    <div className="flex h-[300px] w-auto flex-col items-center overflow-y-auto justify-center bg-background p-4">
      <PdfViewer
        fileUrl="/clinica_estetica.pdf"
        title="Base de Conocimiento - Clínica Estética Luminescence"
      >
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          Ver archivo de ejemplo
        </Button>
      </PdfViewer>
    </div>
  );
}
