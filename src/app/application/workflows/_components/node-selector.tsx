"use client"

import type React from "react"

import { Bell, Calendar, Clock, Database, Filter, Mail, MessageSquare, Repeat, Zap } from "lucide-react"

export default function NodeSelector() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.effectAllowed = "move"
  }

  return (
    <div className="flex flex-col gap-2  p-3 rounded-md border shadow-sm">
      <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Components</h3>
      <div className="grid grid-cols-3 gap-2">
        <div
          className="flex flex-col items-center justify-center p-2 border rounded-md transition-colors"
          onDragStart={(event) => onDragStart(event, "trigger")}
          draggable
        >
          <Zap className="h-4 w-4 text-rose-500" />
          <span className="text-xs mt-1 text-slate-600">Trigger</span>
        </div>
        <div
          className="flex flex-col items-center justify-center p-2 border rounded-md "
          onDragStart={(event) => onDragStart(event, "action")}
          draggable
        >
          <Repeat className="h-4 w-4 text-emerald-500" />
          <span className="text-xs mt-1 text-slate-600">Action</span>
        </div>
        <div
          className="flex flex-col items-center justify-center p-2 border rounded-md"
          onDragStart={(event) => onDragStart(event, "condition")}
          draggable
        >
          <Filter className="h-4 w-4 text-sky-500" />
          <span className="text-xs mt-1 text-slate-600">Condition</span>
        </div>
        <div
          className="flex flex-col items-center justify-center p-2 border rounded-md"
          onDragStart={(event) => onDragStart(event, "email")}
          draggable
        >
          <Mail className="h-4 w-4 text-violet-500" />
          <span className="text-xs mt-1 text-slate-600">Email</span>
        </div>
        <div
          className="flex flex-col items-center justify-center p-2 border rounded-md "
          onDragStart={(event) => onDragStart(event, "notification")}
          draggable
        >
          <Bell className="h-4 w-4 text-amber-500" />
          <span className="text-xs mt-1 text-slate-600">Notification</span>
        </div>
        <div
          className="flex flex-col items-center justify-center p-2 border rounded-md"
          onDragStart={(event) => onDragStart(event, "database")}
          draggable
        >
          <Database className="h-4 w-4 text-cyan-500" />
          <span className="text-xs mt-1 text-slate-600">Database</span>
        </div>
        <div
          className="flex flex-col items-center justify-center p-2 border rounded-md "
          onDragStart={(event) => onDragStart(event, "schedule")}
          draggable
        >
          <Calendar className="h-4 w-4 text-pink-500" />
          <span className="text-xs mt-1 text-slate-600">Schedule</span>
        </div>
        <div
          className="flex flex-col items-center justify-center p-2 border rounded-md"
          onDragStart={(event) => onDragStart(event, "delay")}
          draggable
        >
          <Clock className="h-4 w-4 text-orange-500" />
          <span className="text-xs mt-1 text-slate-600">Delay</span>
        </div>
        <div
          className="flex flex-col items-center justify-center p-2 border rounded-md "
          onDragStart={(event) => onDragStart(event, "chat")}
          draggable
        >
          <MessageSquare className="h-4 w-4 text-lime-500" />
          <span className="text-xs mt-1 text-slate-600">Chat</span>
        </div>
      </div>
    </div>
  )
}
