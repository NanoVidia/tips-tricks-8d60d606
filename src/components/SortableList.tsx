import { ReactNode } from "react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface SortableListProps {
  ids: string[];
  onReorder: (ids: string[]) => void;
  children: ReactNode;
}

export function SortableList({ ids, onReorder, children }: SortableListProps) {
  const sensors = useSensors(
    // 8px activation distance keeps tap-to-expand on accordions usable while
    // still allowing a deliberate drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

interface SortableRowProps {
  id: string;
  children: ReactNode;
  className?: string;
  /** ARIA label for the drag handle */
  handleLabel?: string;
}

/**
 * Wraps an item with a left-aligned drag handle. The handle is the only
 * draggable surface — taps elsewhere (e.g. the Accordion trigger) work
 * normally.
 */
export function SortableRow({ id, children, className, handleLabel = "Reorder" }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-stretch ${className ?? ""} ${isDragging ? "shadow-lg ring-2 ring-primary/40 rounded-2xl" : ""}`}
    >
      <button
        type="button"
        aria-label={handleLabel}
        {...attributes}
        {...listeners}
        className="flex shrink-0 items-center justify-center px-1.5 cursor-grab active:cursor-grabbing touch-none text-muted-foreground/50 hover:text-foreground transition-colors rounded-l-2xl"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
