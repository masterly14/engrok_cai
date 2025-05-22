import { Handle, type NodeProps, Position } from "reactflow"
import { Bell, Calendar, Clock, Database, Filter, Mail, MessageSquare, Repeat, Zap } from "lucide-react"

function TriggerNode({ data }: NodeProps) {
  return (
    <div className="rounded-md border bg-muted text-card-foreground shadow-sm w-[200px] overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-slate-100">
        <Zap className="h-4 w-4 text-rose-500" />
        <div>
          <h3 className="text-sm font-medium">Trigger</h3>
          <p className="text-xs text-slate-500">{data.label}</p>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span className="text-xs text-slate-500">Active</span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="! !bg-muted-foreground !w-1 !h-1" />
    </div>
  )
}

function ActionNode({ data }: NodeProps) {
  return (
    <div className="rounded-md border bg-muted text-card-foreground shadow-sm w-[200px] overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-slate-100">
        <Repeat className="h-4 w-4 text-emerald-500" />
        <div>
          <h3 className="text-sm font-medium">Action</h3>
          <p className="text-xs text-slate-500">{data.label}</p>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span className="text-xs text-slate-500">Ready</span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="target" position={Position.Top} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="source" position={Position.Right} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="source" position={Position.Bottom} className="!bg-white !border-slate-300 !w-1 !h-1" />
    </div>
  )
}

function ConditionNode({ data }: NodeProps) {
  return (
    <div className="rounded-md border bg-muted text-card-foreground shadow-sm w-[200px] overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-slate-100">
        <Filter className="h-4 w-4 text-sky-500" />
        <div>
          <h3 className="text-sm font-medium">Condition</h3>
          <p className="text-xs text-slate-500">{data.label}</p>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span className="text-xs text-slate-500">If/Else</span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="target" position={Position.Top} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="source" position={Position.Right} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="source" position={Position.Bottom} className="!bg-white !border-slate-300 !w-1 !h-1" />
    </div>
  )
}

function EmailNode({ data }: NodeProps) {
  return (
    <div className="rounded-md border bg-muted text-card-foreground shadow-sm w-[200px] overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-slate-100">
        <Mail className="h-4 w-4 text-violet-500" />
        <div>
          <h3 className="text-sm font-medium text-slate-900">Email</h3>
          <p className="text-xs text-slate-500">{data.label}</p>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span className="text-xs text-slate-500">Send Email</span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="target" position={Position.Top} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="source" position={Position.Right} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="source" position={Position.Bottom} className="!bg-white !border-slate-300 !w-1 !h-1" />
    </div>
  )
}

function NotificationNode({ data }: NodeProps) {
  return (
    <div className="rounded-md border bg-white text-card-foreground shadow-sm w-[200px] overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-slate-100">
        <Bell className="h-4 w-4 text-amber-500" />
        <div>
          <h3 className="text-sm font-medium text-slate-900">Notification</h3>
          <p className="text-xs text-slate-500">{data.label}</p>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span className="text-xs text-slate-500">Send Alert</span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="target" position={Position.Top} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="source" position={Position.Right} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="source" position={Position.Bottom} className="!bg-white !border-slate-300 !w-1 !h-1" />
    </div>
  )
}

function DatabaseNode({ data }: NodeProps) {
  return (
    <div className="rounded-md border bg-muted text-card-foreground shadow-sm w-[200px] overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-slate-100">
        <Database className="h-4 w-4 text-cyan-500" />
        <div>
          <h3 className="text-sm font-medium">Database</h3>
          <p className="text-xs text-slate-500">{data.label}</p>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span className="text-xs text-slate-500">Store Data</span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="target" position={Position.Top} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="source" position={Position.Right} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="source" position={Position.Bottom} className="!bg-white !border-slate-300 !w-1 !h-1" />
    </div>
  )
}

function ScheduleNode({ data }: NodeProps) {
  return (
    <div className="rounded-md border bg-muted text-card-foreground shadow-sm w-[200px] overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-slate-100">
        <Calendar className="h-4 w-4 text-pink-500" />
        <div>
          <h3 className="text-sm font-medium">Schedule</h3>
          <p className="text-xs text-slate-500">{data.label}</p>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span className="text-xs text-slate-500">Set Timing</span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="target" position={Position.Top} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="source" position={Position.Right} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="source" position={Position.Bottom} className="!bg-white !border-slate-300 !w-1 !h-1" />
    </div>
  )
}

function DelayNode({ data }: NodeProps) {
  return (
    <div className="rounded-md border bg-muted text-card-foreground shadow-sm w-[200px] overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-slate-100">
        <Clock className="h-4 w-4 text-orange-500" />
        <div>
          <h3 className="text-sm font-medium">Delay</h3>
          <p className="text-xs text-slate-500">{data.label}</p>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span className="text-xs text-slate-500">Wait</span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="target" position={Position.Top} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="source" position={Position.Right} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="source" position={Position.Bottom} className="!bg-white !border-slate-300 !w-1 !h-1" />
    </div>
  )
}

function ChatNode({ data }: NodeProps) {
  return (
    <div className="rounded-md border bg-muted-foreground text-card-foreground shadow-sm w-[200px] overflow-hidden">
      <div className="flex items-center gap-2 p-3 border-b border-slate-100">
        <MessageSquare className="h-4 w-4 text-lime-500" />
        <div>
          <h3 className="text-sm font-medium text-slate-900">Chat</h3>
          <p className="text-xs text-slate-500">{data.label}</p>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span className="text-xs text-slate-500">Send Message</span>
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="target" position={Position.Top} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="source" position={Position.Right} className="!bg-white !border-slate-300 !w-1 !h-1" />
      <Handle type="source" position={Position.Bottom} className="!bg-white !border-slate-300 !w-1 !h-1" />
    </div>
  )
}

export const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  email: EmailNode,
  notification: NotificationNode,
  database: DatabaseNode,
  schedule: ScheduleNode,
  delay: DelayNode,
  chat: ChatNode,
}
