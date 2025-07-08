"use client";

import {
  MessageSquare,
  Brain,
  Wrench,
  PhoneForwarded,
  PhoneOff,
  Server,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, X, ArrowRightCircle } from "lucide-react";

interface NodeSelectorProps {
  onSelect: (NodeType: string) => void;
  onClose: () => void;
}

type NodeCategory = {
  id: string;
  name: string;
  icon: React.ReactNode;
};

type NodeOption = {
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  shortcut: string;
  category: string;
};

const nodeCategories: NodeCategory[] = [
  {
    id: "communication",
    name: "Comunicación",
    icon: <MessageSquare className="w-4 h-4" />,
  },
  { id: "logic", name: "Lógica", icon: <Brain className="w-4 h-4" /> },
  {
    id: "integration",
    name: "Integración",
    icon: <Wrench className="w-4 h-4" />,
  },
];

const nodeOptions: NodeOption[] = [
  {
    type: "conversation",
    label: "Conversación",
    icon: <MessageSquare className="w-4 h-4" />,
    description:
      "Configura el prompt para la parte del flujo de la conversación.",
    shortcut: "Ctrl + Shift + T",
    category: "communication",
  },
  {
    type: "transferCall",
    label: "Transferir Llamada",
    icon: <PhoneForwarded className="w-4 h-4" />,
    description: "Transfiere la llamada a otro destino.",
    shortcut: "Ctrl + Shift + F",
    category: "communication",
  },
  {
    type: "endCall",
    label: "Terminar Llamada",
    icon: <PhoneOff className="w-4 h-4" />,
    description: "Termina la llamada actual.",
    shortcut: "Ctrl + Shift + E",
    category: "communication",
  },
  {
    type: "apiRequest",
    label: "Llamada a API",
    icon: <Server className="w-4 h-4" />,
    description: "Realiza una llamada a una API externa.",
    shortcut: "Ctrl + Shift + A",
    category: "integration",
  },
];

const getNodeColor = (type: string) => {
  switch (type) {
    case "conversation":
      return "from-cyan-500 to-blue-600";
    case "transferCall":
      return "from-green-500 to-emerald-600";
    case "endCall":
      return "from-red-500 to-rose-600";
    case "apiRequest":
      return "from-purple-500 to-violet-600";
    default:
      return "from-gray-500 to-gray-600";
  }
};

export function NodeSelector({ onSelect, onClose }: NodeSelectorProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredNodes = nodeOptions.filter(
    (node) =>
      (activeTab === "all" || node.category === activeTab) &&
      (node.label.toLowerCase().includes(search.toLowerCase()) ||
        node.description.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="absolute bottom-20 right-4 w-96 shadow-xl z-20 bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <h3 className="font-semibold text-gray-900 text-lg">Add a Node</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search nodes..."
              className="pl-9 h-9 bg-gray-50 border-gray-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-3 pt-2">
            <TabsList className="w-full bg-gray-100 p-1">
              <TabsTrigger value="all" className="text-xs">
                All
              </TabsTrigger>
              {nodeCategories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="text-xs flex items-center gap-1.5"
                >
                  {category.icon}
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <div className="p-3 max-h-[320px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                {filteredNodes.map((option) => (
                  <motion.div
                    key={option.type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="ghost"
                      className="w-full h-auto p-0 overflow-hidden bg-white hover:bg-gray-50 shadow-sm border border-gray-200 rounded-lg"
                      onClick={() => onSelect(option.type)}
                    >
                      <div className="flex flex-col w-full">
                        <div
                          className={`w-full py-3 px-3 bg-gradient-to-r ${getNodeColor(option.type)} flex items-center justify-between`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="bg-white/20 rounded-md p-1.5">
                              {option.icon}
                            </div>
                            <span className="font-medium text-white">
                              {option.label}
                            </span>
                          </div>
                          <ArrowRightCircle className="h-4 w-4 text-white/70" />
                        </div>
                        <div className="p-2 text-left">
                          <span className="text-xs text-gray-500 font-mono block mt-1">
                            {option.shortcut}
                          </span>
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>

              {filteredNodes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No nodes match your search
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </motion.div>
  );
}
