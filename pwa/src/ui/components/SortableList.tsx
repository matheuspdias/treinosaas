import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../cn'

export interface DragHandleProps {
  attributes: DraggableAttributes
  listeners: DraggableSyntheticListeners
  label: string
}

/** Alça de arrastar (48px). Só ela inicia o arraste, então rolar a lista continua natural. */
export function DragHandle({ attributes, listeners, label }: DragHandleProps) {
  return (
    <button
      type="button"
      aria-label={`Reordenar ${label}`}
      className="flex size-touch shrink-0 cursor-grab touch-none items-center justify-center rounded-control text-fg-subtle active:cursor-grabbing active:bg-surface-2"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-5" />
    </button>
  )
}

function SortableItem({
  id,
  children,
}: {
  id: string
  children: (handle: Omit<DragHandleProps, 'label'>, dragging: boolean) => ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('relative', isDragging && 'z-10')}
    >
      {children({ attributes, listeners }, isDragging)}
    </li>
  )
}

export interface SortableListProps<T> {
  items: readonly T[]
  getId: (item: T) => string
  getLabel: (item: T) => string
  onReorder: (from: number, to: number) => void
  renderItem: (
    item: T,
    handle: Omit<DragHandleProps, 'label'>,
    dragging: boolean,
    index: number,
  ) => ReactNode
  className?: string
}

export function SortableList<T>({
  items,
  getId,
  getLabel,
  onReorder,
  renderItem,
  className,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const ids = items.map(getId)
  const labelOf = (id: string | number) => {
    const item = items.find((i) => getId(i) === id)
    return item ? getLabel(item) : ''
  }
  const position = (id: string | number) => ids.indexOf(String(id)) + 1

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      accessibility={{
        screenReaderInstructions: {
          draggable:
            'Para reordenar, pressione espaço, use as setas para mover e espaço de novo para soltar. Esc cancela.',
        },
        announcements: {
          onDragStart: ({ active }) =>
            `${labelOf(active.id)} selecionado, posição ${position(active.id)} de ${ids.length}.`,
          onDragOver: ({ active, over }) =>
            over ? `${labelOf(active.id)} movido para a posição ${position(over.id)}.` : '',
          onDragEnd: ({ active, over }) =>
            over ? `${labelOf(active.id)} solto na posição ${position(over.id)}.` : '',
          onDragCancel: ({ active }) => `Reordenação de ${labelOf(active.id)} cancelada.`,
        },
      }}
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return
        onReorder(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)))
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className={className}>
          {items.map((item, index) => (
            <SortableItem key={getId(item)} id={getId(item)}>
              {(handle, dragging) => renderItem(item, handle, dragging, index)}
            </SortableItem>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
