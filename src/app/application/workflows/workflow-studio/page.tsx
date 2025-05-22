import WorkflowBuilder from "../_components/workflow-builde";


export default function Page() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-14 items-center px-4">
          <h1 className="text-lg font-medium text-slate-900">Workflow Builder</h1>
          <div className="ml-auto flex items-center gap-2">
            <button className="inline-flex h-8 items-center justify-center rounded-md border px-4 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              Cancel
            </button>
            <button className="inline-flex h-8 items-center justify-center rounded-md px-4 text-xs font-medium text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
              Save Workflow
            </button>
          </div>
        </div>
      </header>
      <div className="flex-1">
        <WorkflowBuilder />
      </div>
    </main>
  )
}
