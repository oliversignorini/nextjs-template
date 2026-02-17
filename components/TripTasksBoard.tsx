'use client'

import { useState, useMemo } from 'react'
import { useTripTasks } from '@/lib/api'
import { tripPriorityBadgeClass, getAssigneeName } from '@/lib/badge-utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { TripTask, TripTaskStatus } from '@/types'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

const COLUMNS: { status: TripTaskStatus; label: string; colorClass: string }[] = [
  { status: 'To Research', label: 'To Research', colorClass: 'bg-amber-100 text-amber-600' },
  {
    status: 'Booking',
    label: 'Booking',
    colorClass: 'bg-brand-400/20 text-brand-700',
  },
  { status: 'Confirmed', label: 'Confirmed', colorClass: 'bg-slate-200 text-brand-900' },
  { status: 'Done', label: 'Done', colorClass: 'bg-emerald-100 text-emerald-600' },
]

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, col) => (
        <div key={col} className="space-y-3">
          <div className="h-8 w-full animate-pulse rounded bg-border" />
          {Array.from({ length: 2 }).map((_, row) => (
            <div key={row} className="h-24 w-full animate-pulse rounded bg-muted" />
          ))}
        </div>
      ))}
    </div>
  )
}

function TaskCard({ task }: { task: TripTask }) {
  const assignee = getAssigneeName(task.assignee)

  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-2 p-3">
        <p className="line-clamp-2 text-sm font-medium">{task.title}</p>

        {task.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
        )}

        <div className="flex items-center justify-between">
          <Badge className={tripPriorityBadgeClass(task.priority)}>{task.priority}</Badge>
          {assignee && <span className="text-xs text-muted-foreground">{assignee}</span>}
        </div>

        {task.dueDate && (
          <p className="text-xs text-muted-foreground/60">Due {task.dueDate}</p>
        )}
      </CardContent>
    </Card>
  )
}

function SortableTaskCard({ task }: { task: TripTask }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} />
    </div>
  )
}

function DroppableColumn({
  column,
  tasks,
  isOver,
}: {
  column: (typeof COLUMNS)[number]
  tasks: TripTask[]
  isOver: boolean
}) {
  const { setNodeRef } = useDroppable({ id: column.status })

  return (
    <div ref={setNodeRef} className="space-y-3">
      {/* Column header */}
      <div
        className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold ${column.colorClass}`}
      >
        <span>{column.label}</span>
        <span className="ml-2 text-xs font-normal opacity-70">{tasks.length}</span>
      </div>

      {/* Droppable area */}
      <div
        className={`min-h-[80px] space-y-3 rounded-md p-1 transition-all ${
          isOver ? 'ring-2 ring-brand-400/50 bg-brand-400/5' : ''
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">No tasks</p>
          ) : (
            tasks.map((task) => <SortableTaskCard key={task.id} task={task} />)
          )}
        </SortableContext>
      </div>
    </div>
  )
}

export function TripTasksBoard() {
  const { data: fetchedTasks, isLoading, error } = useTripTasks()
  const [localTasks, setLocalTasks] = useState<TripTask[] | null>(null)
  const [activeTask, setActiveTask] = useState<TripTask | null>(null)
  const [overColumnId, setOverColumnId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  // Sync fetched data into local state once loaded
  if (fetchedTasks && !localTasks) {
    setLocalTasks(fetchedTasks)
  }

  // Use local state once we have data, so DnD moves are instant
  const tasks = useMemo(() => localTasks ?? fetchedTasks ?? [], [localTasks, fetchedTasks])

  const tasksByColumn = useMemo(() => {
    const map: Record<TripTaskStatus, TripTask[]> = {
      'To Research': [],
      Booking: [],
      Confirmed: [],
      Done: [],
    }
    for (const task of tasks) {
      map[task.status]?.push(task)
    }
    return map
  }, [tasks])

  function findColumnForTask(taskId: string): TripTaskStatus | null {
    for (const task of tasks) {
      if (task.id === taskId) return task.status
    }
    return null
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) {
      setOverColumnId(null)
      return
    }

    const overId = String(over.id)

    // Determine the target column
    let targetColumn: TripTaskStatus | null = null
    if (COLUMNS.some((col) => col.status === overId)) {
      targetColumn = overId as TripTaskStatus
    } else {
      targetColumn = findColumnForTask(overId)
    }

    setOverColumnId(targetColumn)

    if (!targetColumn) return

    const activeColumn = findColumnForTask(String(active.id))
    if (activeColumn && activeColumn !== targetColumn) {
      // Move task to new column
      setLocalTasks((prev) =>
        (prev ?? []).map((t) => (t.id === active.id ? { ...t, status: targetColumn } : t)),
      )
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    setOverColumnId(null)

    if (!over) return

    const overId = String(over.id)
    const activeId = String(active.id)

    // If dropped on a different task in the same column, reorder
    const activeColumn = findColumnForTask(activeId)
    const overColumn = COLUMNS.some((col) => col.status === overId)
      ? (overId as TripTaskStatus)
      : findColumnForTask(overId)

    if (activeColumn && overColumn && activeColumn === overColumn && activeId !== overId) {
      const columnTasks = tasksByColumn[activeColumn]
      const activeIndex = columnTasks.findIndex((t) => t.id === activeId)
      const overIndex = columnTasks.findIndex((t) => t.id === overId)

      if (activeIndex !== -1 && overIndex !== -1) {
        const reordered = [...columnTasks]
        const [moved] = reordered.splice(activeIndex, 1)
        reordered.splice(overIndex, 0, moved)

        setLocalTasks((prev) => {
          const otherTasks = (prev ?? []).filter((t) => t.status !== activeColumn)
          return [...otherTasks, ...reordered]
        })
      }
    }
  }

  if (isLoading) return <LoadingSkeleton />

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-destructive">
          Failed to load tasks. Please try again later.
        </CardContent>
      </Card>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map((column) => (
          <DroppableColumn
            key={column.status}
            column={column}
            tasks={tasksByColumn[column.status]}
            isOver={overColumnId === column.status}
          />
        ))}
      </div>

      <DragOverlay>{activeTask ? <TaskCard task={activeTask} /> : null}</DragOverlay>
    </DndContext>
  )
}
