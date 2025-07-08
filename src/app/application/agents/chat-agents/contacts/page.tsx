"use client";

import { useChatContacts } from "@/hooks/use-chat-contacts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Users,
  Phone,
  Calendar,
  UserPlus,
  Search,
  AlertCircle,
  MessageSquare,
  Filter,
  UploadCloud,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Send,
} from "lucide-react";
import Papa from "papaparse";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAllChatAgents } from "@/hooks/use-all-chat-agents";
import { importContacts } from "@/actions/chat-contacts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMessageTemplates } from "@/hooks/use-message-templates";
import { sendTemplateMessage } from "@/actions/messages";

type ChatContactWithAgent = NonNullable<
  Awaited<ReturnType<typeof useChatContacts>>["contacts"]
>[0];

function getTemplateVariables(template: any): string[] {
  if (!template?.components?.components) return [];

  const vars = new Set<string>();
  const components = template.components.components;

  const header = components.find((c: any) => c.type === "HEADER");
  if (header?.text) {
    const matches = header.text.matchAll(/\\{\\{(\\d+)\\}\\}/g);
    for (const match of matches) {
      vars.add(match[1]);
    }
  }

  const body = components.find((c: any) => c.type === "BODY");
  if (body?.text) {
    const matches = body.text.matchAll(/\\{\\{(\\d+)\\}\\}/g);
    for (const match of matches) {
      vars.add(match[1]);
    }
  }

  return Array.from(vars).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
}

const SendMessageModal = ({
  contact,
  isOpen,
  onClose,
}: {
  contact: ChatContactWithAgent | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const {
    templatesData: messageTemplates,
    templatesLoading: isLoadingTemplates,
  } = useMessageTemplates(contact?.chatAgentId);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [variables, setVariables] = useState<Record<string, string>>({});

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: {
      contactId: string;
      templateId: string;
      variables: Record<string, string>;
    }) => sendTemplateMessage(data.contactId, data.templateId, data.variables),
    onSuccess: () => {
      toast.success("Mensaje de plantilla enviado correctamente.");
      onClose();
      setSelectedTemplateId(null);
      setVariables({});
    },
    onError: (error: any) => {
      toast.error(`Error al enviar el mensaje: ${error.message}`);
    },
  });

  const selectedTemplate = messageTemplates?.data?.find(
    (t) => t.id === selectedTemplateId,
  );
  const templateVars = selectedTemplate
    ? getTemplateVariables(selectedTemplate)
    : [];

  const handleVariableChange = (index: string, value: string) => {
    setVariables((prev) => ({ ...prev, [index]: value }));
  };

  const handleSend = () => {
    if (!contact || !selectedTemplateId) return;
    mutation.mutate({
      contactId: contact.id,
      templateId: selectedTemplateId,
      variables,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Enviar Mensaje Plantilla a {contact?.name || contact?.phone}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Seleccionar Plantilla
            </label>
            <Select
              onValueChange={(id) => {
                setSelectedTemplateId(id);
                setVariables({});
              }}
              disabled={isLoadingTemplates}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingTemplates
                      ? "Cargando plantillas..."
                      : "Elige una plantilla"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {messageTemplates?.data?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name} ({template.language})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {templateVars.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Variables de la Plantilla</h4>
              {templateVars.map((v) => (
                <div key={v}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Variable {"{{" + v + "}}"}
                  </label>
                  <Input
                    value={variables[v] || ""}
                    onChange={(e) => handleVariableChange(v, e.target.value)}
                    placeholder={`Valor para la variable ${v}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <Button
            onClick={handleSend}
            disabled={!selectedTemplateId || mutation.isPending}
          >
            {mutation.isPending ? "Enviando..." : "Enviar Mensaje"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AddContactForm = ({ closeModal }: { closeModal: () => void }) => {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [phoneColumn, setPhoneColumn] = useState<string>("");
  const [nameColumn, setNameColumn] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [error, setError] = useState<string>("");

  const { data: chatAgents } = useAllChatAgents();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (variables: {
      contacts: { phone: string; name?: string }[];
      chatAgentId: string;
    }) => importContacts(variables.contacts, variables.chatAgentId),
    onSuccess: (data) => {
      toast.success(`${data.count} contactos importados exitosamente!`);
      queryClient.invalidateQueries({ queryKey: ["chatContacts"] });
      resetState();
      closeModal();
    },
    onError: (error) => {
      toast.error(`Error al importar: ${error.message}`);
      setStep(2); // Go back to preview
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      if (selectedFile.type !== "text/csv") {
        setError("Por favor, selecciona un archivo CSV.");
        return;
      }
      setError("");
      setFile(selectedFile);
      parseCsv(selectedFile);
    }
  };

  const parseCsv = (fileToParse: File) => {
    Papa.parse(fileToParse, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields) {
          setHeaders(results.meta.fields);
        }
        setParsedData(results.data);
      },
      error: (err) => {
        setError("Error al parsear el archivo CSV: " + err.message);
      },
    });
  };

  const handleContinue = () => {
    if (phoneColumn) {
      setStep(2);
    }
  };

  const handleImport = () => {
    if (!selectedAgent || !phoneColumn) return;

    const contactsToImport = parsedData
      .map((row) => ({
        phone: row[phoneColumn],
        name: nameColumn ? row[nameColumn] : undefined,
      }))
      .filter((contact) => contact.phone); // Ensure phone number exists

    if (contactsToImport.length === 0) {
      toast.warning("No se encontraron contactos válidos para importar.");
      return;
    }

    mutation.mutate({ contacts: contactsToImport, chatAgentId: selectedAgent });
    setStep(3); // Go to loading state
  };

  const resetState = () => {
    setStep(1);
    setFile(null);
    setHeaders([]);
    setParsedData([]);
    setPhoneColumn("");
    setNameColumn("");
    setSelectedAgent("");
    setError("");
  };

  const renderStep = () => {
    switch (step) {
      case 1: // File Upload and Mapping
        return (
          <div className="space-y-4">
            {!file ? (
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 border-slate-300"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-10 h-10 mb-4 text-slate-500" />
                    <p className="mb-2 text-sm text-slate-500">
                      <span className="font-semibold">Haz clic para subir</span>{" "}
                      o arrastra y suelta
                    </p>
                    <p className="text-xs text-slate-500">CSV (MAX. 5MB)</p>
                  </div>
                  <input
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg">Archivo Cargado</h3>
                  <p className="text-sm text-slate-600">{file.name}</p>
                </div>
                <h3 className="font-medium text-lg">Mapeo de Campos</h3>
                <p className="text-sm text-slate-600">
                  Selecciona las columnas que corresponden al nombre y teléfono.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="name-column"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Columna para el Nombre
                    </label>
                    <Select onValueChange={setNameColumn} value={nameColumn}>
                      <SelectTrigger id="name-column">
                        <SelectValue placeholder="Selecciona una columna" />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label
                      htmlFor="phone-column"
                      className="block text-sm font-medium text-slate-700 mb-1"
                    >
                      Columna para el Teléfono (Requerido)
                    </label>
                    <Select onValueChange={setPhoneColumn} value={phoneColumn}>
                      <SelectTrigger id="phone-column">
                        <SelectValue placeholder="Selecciona una columna" />
                      </SelectTrigger>
                      <SelectContent>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="ghost" onClick={resetState}>
                Cancelar
              </Button>
              <Button onClick={handleContinue} disabled={!file || !phoneColumn}>
                Continuar
              </Button>
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>
        );
      case 2: // Preview and Agent Selection
        const previewContacts = parsedData
          .slice(0, 5)
          .map((row) => ({
            phone: row[phoneColumn],
            name: nameColumn ? row[nameColumn] : "N/A",
          }));
        return (
          <div className="space-y-4">
            <h3 className="font-medium text-lg">
              Asignar Agente y Previsualizar
            </h3>
            <div>
              <label
                htmlFor="agent-select"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Asignar contactos al agente:
              </label>
              <Select onValueChange={setSelectedAgent} value={selectedAgent}>
                <SelectTrigger id="agent-select">
                  <SelectValue placeholder="Selecciona un agente" />
                </SelectTrigger>
                <SelectContent>
                  {chatAgents?.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <h4 className="font-medium text-slate-800 mb-2">
                Vista Previa (primeras 5 filas)
              </h4>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Teléfono</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewContacts.map((contact, i) => (
                      <TableRow key={i}>
                        <TableCell>{contact.name}</TableCell>
                        <TableCell>{contact.phone}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                Se importarán un total de <strong>{parsedData.length}</strong>{" "}
                contactos.
              </p>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Atrás
              </Button>
              <Button onClick={handleImport} disabled={!selectedAgent}>
                Importar Contactos
              </Button>
            </div>
          </div>
        );
      case 3: // Loading
        return (
          <div className="flex flex-col items-center justify-center h-48">
            <div className="loader ease-linear rounded-full border-4 border-t-4 border-slate-200 h-12 w-12 mb-4 animate-spin border-t-blue-600"></div>
            <h3 className="text-lg font-medium text-slate-700">
              Importando contactos...
            </h3>
            <p className="text-sm text-slate-500">
              Esto puede tardar unos segundos.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return <div className="p-1">{renderStep()}</div>;
};

const ContactsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSendMessageModalOpen, setIsSendMessageModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] =
    useState<ChatContactWithAgent | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { contacts, isLoading, isError, error } = useChatContacts();

  const handleOpenSendMessageModal = (contact: ChatContactWithAgent) => {
    setSelectedContact(contact);
    setIsSendMessageModalOpen(true);
  };

  // Filter contacts based on search term
  const filteredContacts = contacts?.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm) ||
      contact.chatAgent.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table Skeleton */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-10 w-full max-w-sm" />
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-0 shadow-sm bg-red-50 border-red-200">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">
                Error al cargar contactos
              </h2>
              <p className="text-red-600 mb-4">{error?.message}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Intentar de nuevo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const totalContacts = contacts?.length || 0;
  const uniqueAgents = new Set(contacts?.map((c) => c.chatAgent.name)).size;
  const recentContacts =
    contacts?.filter(
      (c) =>
        new Date(c.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    ).length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                Contactos
              </h1>
            </div>
            <p className="text-slate-600">
              Gestiona todos tus contactos de WhatsApp
            </p>
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200">
                <UserPlus className="h-4 w-4 mr-2" />
                Añadir más contactos
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Importar Contactos desde CSV</DialogTitle>
              </DialogHeader>
              <AddContactForm closeModal={() => setIsModalOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-600 rounded-full">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700">
                    Total Contactos
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {totalContacts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-600 rounded-full">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Agentes Activos
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {uniqueAgents}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-600 rounded-full">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-700">
                    Esta Semana
                  </p>
                  <p className="text-2xl font-bold text-purple-900">
                    {recentContacts}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contacts Table */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-slate-600" />
                Lista de Contactos
              </CardTitle>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar contactos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-80 border-slate-200 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Nombre
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Teléfono
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Agente de Chat
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Creado
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right w-[100px]">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts?.length ? (
                    filteredContacts.map((contact, index) => (
                      <TableRow
                        key={contact.id}
                        className="hover:bg-slate-50 transition-colors duration-150"
                        style={{
                          animationDelay: `${index * 50}ms`,
                        }}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {contact.name
                                ? contact.name.charAt(0).toUpperCase()
                                : "?"}
                            </div>
                            <span>{contact.name || "Sin nombre"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-slate-400" />
                            <span className="font-mono text-sm">
                              {contact.phone}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800 hover:bg-green-200"
                          >
                            {contact.chatAgent.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            {new Date(contact.createdAt).toLocaleDateString(
                              "es-ES",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleOpenSendMessageModal(contact)
                                }
                              >
                                <Send className="mr-2 h-4 w-4" />
                                <span>Enviar Mensaje Plantilla</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : searchTerm ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <Search className="h-12 w-12 text-slate-300" />
                          <div>
                            <p className="text-slate-600 font-medium">
                              No se encontraron contactos
                            </p>
                            <p className="text-slate-500 text-sm">
                              Intenta con otros términos de búsqueda
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                            <Users className="h-8 w-8 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-slate-600 font-medium mb-1">
                              No tienes contactos aún
                            </p>
                            <p className="text-slate-500 text-sm mb-4">
                              Comienza agregando tu primer contacto
                            </p>
                            <Button
                              onClick={() => setIsModalOpen(true)}
                              size="sm"
                              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Añadir Contacto
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Results Summary */}
            {filteredContacts && filteredContacts.length > 0 && (
              <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
                <p>
                  Mostrando {filteredContacts.length} de {totalContacts}{" "}
                  contactos
                  {searchTerm && (
                    <span className="ml-1">
                      para "<span className="font-medium">{searchTerm}</span>"
                    </span>
                  )}
                </p>
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    Limpiar filtro
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        <SendMessageModal
          contact={selectedContact}
          isOpen={isSendMessageModalOpen}
          onClose={() => setIsSendMessageModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default ContactsPage;
