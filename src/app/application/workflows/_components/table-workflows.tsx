"use client"

import * as React from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, Play, Pause, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Define the Workflow type
export type Workflow = {
  id: string
  name: string
  status: "active" | "inactive" | "error"
  triggerType: "scheduled" | "webhook" | "manual" | "event"
  lastRun: Date | null
  nextRun: Date | null
  createdBy: string
  createdAt: Date
}

// Sample data for demonstration
const data: Workflow[] = [
  {
    id: "wf-001",
    name: "Daily Report Generation",
    status: "active",
    triggerType: "scheduled",
    lastRun: new Date(Date.now() - 86400000), // 1 day ago
    nextRun: new Date(Date.now() + 86400000), // 1 day from now
    createdBy: "Sarah Johnson",
    createdAt: new Date("2023-01-15"),
  },
]

// Helper function to format dates
const formatDate = (date: Date | null) => {
  if (!date) return "N/A"
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

// Status badge component
const StatusBadge = ({ status }: { status: Workflow["status"] }) => {
  const variants = {
    active: "bg-green-100 text-green-800 hover:bg-green-100",
    inactive: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    error: "bg-red-100 text-red-800 hover:bg-red-100",
  }

  const icons = {
    active: <Play className="h-3 w-3 mr-1" />,
    inactive: <Pause className="h-3 w-3 mr-1" />,
    error: <AlertTriangle className="h-3 w-3 mr-1" />,
  }

  return (
    <Badge variant="outline" className={`flex items-center ${variants[status]}`}>
      {icons[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

export default function TableWorkflows() {
  // Define columns
  const columns: ColumnDef<Workflow>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Workflow Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: "triggerType",
      header: "Trigger Type",
      cell: ({ row }) => <div className="capitalize">{row.getValue("triggerType")}</div>,
    },
    {
      accessorKey: "lastRun",
      header: ({ column }) => {
        return (
          <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Last Run
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => formatDate(row.original.lastRun),
      sortingFn: (rowA, rowB, columnId) => {
        const dateA = rowA.original.lastRun?.getTime() || 0
        const dateB = rowB.original.lastRun?.getTime() || 0
        return dateA - dateB
      },
    },
    {
      accessorKey: "nextRun",
      header: "Next Run",
      cell: ({ row }) => formatDate(row.original.nextRun),
    },
    {
      accessorKey: "createdBy",
      header: "Created By",
      cell: ({ row }) => <div>{row.getValue("createdBy")}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const workflow = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(workflow.id)}>
                Copy workflow ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View workflow details</DropdownMenuItem>
              <DropdownMenuItem>Edit workflow</DropdownMenuItem>
              {workflow.status === "active" ? (
                <DropdownMenuItem>Pause workflow</DropdownMenuItem>
              ) : (
                <DropdownMenuItem>Activate workflow</DropdownMenuItem>
              )}
              {workflow.status === "error" && <DropdownMenuItem>Troubleshoot</DropdownMenuItem>}
              <DropdownMenuItem className="text-red-600">Delete workflow</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [statusFilter, setStatusFilter] = React.useState<string[]>([])

  // Initialize the table
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Apply status filter when it changes
  React.useEffect(() => {
    if (statusFilter.length > 0) {
      table.getColumn("status")?.setFilterValue(statusFilter)
    } else {
      table.getColumn("status")?.setFilterValue(undefined)
    }
  }, [statusFilter, table])

  return (
    <div className="w-full p-10">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
            <Button >Create workflow</Button>
          <Input
            placeholder="Filter workflow..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
            className="max-w-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-2">
                Status <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("active")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setStatusFilter([...statusFilter, "active"])
                  } else {
                    setStatusFilter(statusFilter.filter((s) => s !== "active"))
                  }
                }}
              >
                Active
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("inactive")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setStatusFilter([...statusFilter, "inactive"])
                  } else {
                    setStatusFilter(statusFilter.filter((s) => s !== "inactive"))
                  }
                }}
              >
                Inactive
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilter.includes("error")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setStatusFilter([...statusFilter, "error"])
                  } else {
                    setStatusFilter(statusFilter.filter((s) => s !== "error"))
                  }
                }}
              >
                Error
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id === "lastRun"
                      ? "Last Run"
                      : column.id === "nextRun"
                        ? "Next Run"
                        : column.id === "createdBy"
                          ? "Created By"
                          : column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No workflows found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} workflow(s) found.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
