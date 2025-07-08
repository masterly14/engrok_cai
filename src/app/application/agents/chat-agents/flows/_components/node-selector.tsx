"use client";

import type React from "react";

import {
  MessageSquare,
  Database,
  Globe,
  PowerOff,
  Save,
  GitBranch,
  Search,
  X,
  Sparkles,
  Zap,
  User,
  BrainCircuit,
  Clock,
} from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NodeSelectorProps {
  onSelect: (nodeType: string) => void;
  onClose: () => void;
}

type NodeCategory = {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
};

type NodeOption = {
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  category: string;
  tags: string[];
  isPopular?: boolean;
  isNew?: boolean;
};

const nodeCategories: NodeCategory[] = [
  {
    id: "communication",
    name: "Communication",
    icon: <MessageSquare className="w-4 h-4" />,
    color: "from-blue-500 to-cyan-500",
    description: "User interaction and messaging",
  },
  {
    id: "logic",
    name: "Logic & Control",
    icon: <GitBranch className="w-4 h-4" />,
    color: "from-emerald-500 to-teal-500",
    description: "Flow control and decision making",
  },
];

const nodeOptions: NodeOption[] = [
  {
    type: "conversation",
    label: "Conversación",
    icon: <MessageSquare className="w-4 h-4" />,
    description: "Interacción con el usuario",
    category: "communication",
    tags: ["chat", "message", "user"],
    isPopular: true,
  },
  {
    type: "condition",
    label: "Condición",
    icon: <GitBranch className="w-4 h-4" />,
    description: "Condición para el flujo",
    category: "logic",
    tags: ["if", "branch", "decision"],
    isPopular: true,
  },
  {
    type: "captureResponse",
    label: "Capturar respuesta",
    icon: <Save className="w-4 h-4" />,
    description: "Capturar respuesta del usuario",
    category: "logic",
    tags: ["save", "store", "variable"],
  },
  {
    type: "reminder",
    label: "Recordatorio",
    icon: <Clock className="w-4 h-4" />,
    description: "Espera un tiempo y luego continúa el flujo",
    category: "logic",
    tags: ["wait", "delay", "schedule", "timer", "reminder"],
    isNew: true,
  },
  {
    type: "ai",
    label: "Inteligencia Artificial",
    icon: <BrainCircuit className="w-4 h-4" />,
    description: "Inteligencia Artificial",
    category: "ai",
    tags: ["ai", "chat", "agent"],
    isNew: true,
  },
  {
    type: "turnOffAgent",
    label: "Finalizar conversación",
    icon: <PowerOff className="w-4 h-4" />,
    description: "Terminar la conversación",
    category: "communication",
    tags: ["end", "stop", "finish"],
  },
  {
    type: "apiRequest",
    label: "Petición API",
    icon: <Globe className="w-4 h-4" />,
    description: "Llamada a APIs externas",
    category: "integration",
    tags: ["api", "http", "external"],
  },
  {
    type: "crm",
    label: "Acciones CRM",
    icon: <Database className="w-4 h-4" />,
    description: "Conexión con sistemas CRM",
    category: "integration",
    tags: ["crm", "customer", "data"],
    isNew: true,
  },
  {
    type: "trigger",
    label: "Trigger",
    icon: <Zap className="w-4 h-4" />,
    description: "Disparador externo (webhook, integraciones)",
    category: "integration",
    tags: ["webhook", "event", "zapier", "make"],
    isNew: true,
  },
  {
    type: "handoverToHuman",
    label: "Handover a agente",
    icon: <User className="w-4 h-4" />,
    description: "Transfiere la conversación a un agente humano",
    category: "communication",
    tags: ["handover", "agente", "humano", "live"],
    isNew: true,
  },
  {
    type: "integration",
    label: "Integración",
    icon: <Globe className="w-4 h-4" />,
    description: "Integración con un servicio externo",
    category: "integration",
    tags: ["api", "http", "external"],
    isNew: true,
  },
];

export function NodeSelector({ onSelect, onClose }: NodeSelectorProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredNodes = useMemo(() => {
    return nodeOptions.filter((node) => {
      const matchesSearch =
        node.label.toLowerCase().includes(search.toLowerCase()) ||
        node.description.toLowerCase().includes(search.toLowerCase()) ||
        node.tags.some((tag) =>
          tag.toLowerCase().includes(search.toLowerCase()),
        );

      const matchesCategory =
        !selectedCategory || node.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  const getCategoryInfo = (categoryId: string) => {
    return nodeCategories.find((cat) => cat.id === categoryId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="absolute top-0 left-6 z-50 mt-4 mb-10 h-[500px]" // Adjusted position
    >
      <Card className="w-96 shadow-2xl border-0  bg-white/95 backdrop-blur-xl overflow-hidden rounded-xl">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-center justify-between p-5">
            <div>
              <h3 className="font-semibold text-gray-900 text-base">
                Agregar nodo
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Elige un componente para tu flujo
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar nodos (e.j: mensaje, API, condición)"
              className="pl-10 h-10 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all duration-200 text-sm bg-gray-50 focus:bg-white rounded-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {" "}
            {/* Added pb-1 for scrollbar */}
            <Button
              variant={selectedCategory === null ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={`whitespace-nowrap text-xs font-medium rounded-md h-8 px-3 ${selectedCategory === null ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "text-gray-600 hover:bg-gray-100"}`}
            >
              Todos
            </Button>
            {nodeCategories.map((category) => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "secondary" : "ghost"
                }
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap text-xs font-medium flex items-center gap-1.5 rounded-md h-8 px-3 ${selectedCategory === category.id ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "text-gray-600 hover:bg-gray-100"}`}
              >
                {category.icon}
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Node List */}
        <div className="max-h-[calc(100vh-380px)] min-h-[200px] overflow-y-auto">
          {" "}
          {/* Adjusted height */}
          <AnimatePresence mode="popLayout">
            {filteredNodes.length > 0 ? (
              <div className="p-2 space-y-1">
                {filteredNodes.map((node, index) => {
                  const categoryInfo = getCategoryInfo(node.category);
                  return (
                    <motion.div
                      key={node.type}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{
                        delay: index * 0.04,
                        duration: 0.25,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      layout
                    >
                      <Button
                        variant="ghost"
                        className="w-full h-auto p-0 hover:bg-gray-50/80 rounded-lg transition-all duration-200 group overflow-hidden"
                        onClick={() => onSelect(node.type)}
                      >
                        <div className="flex items-center gap-4 w-full p-3">
                          <div className="relative">
                            <div
                              className={`p-2.5 rounded-lg bg-gradient-to-br ${categoryInfo?.color} shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105`}
                            >
                              <div className="text-white">{node.icon}</div>
                            </div>
                            {node.isPopular && (
                              <div className="absolute -top-1.5 -right-1.5 bg-orange-500 rounded-full p-0.5 border-2 border-white shadow-sm">
                                <Sparkles className="h-2 w-2 text-white" />
                              </div>
                            )}
                            {node.isNew && (
                              <div className="absolute -top-1.5 -right-1.5 bg-green-500 rounded-full p-0.5 border-2 border-white shadow-sm">
                                <Zap className="h-2 w-2 text-white" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h4 className="font-medium text-gray-800 text-sm group-hover:text-gray-700 transition-colors">
                                {node.label}
                              </h4>
                              {/* Badges can be added here if needed */}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {node.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
                            <svg
                              className="w-2.5 h-2.5 text-gray-400 group-hover:text-gray-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </div>
                      </Button>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 px-4"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <h4 className="font-medium text-gray-700 mb-1 text-sm">
                  No se encontraron nodos
                </h4>
                <p className="text-xs text-gray-500">
                  Intenta con una búsqueda o categoría diferente.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}
