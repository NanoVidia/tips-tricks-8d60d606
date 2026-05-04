import { ReactNode, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
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
  /** Human-friendly name for the kind of item, used in screen-reader announcements. */
  itemTypeLabel?: string;
  /** Lookup for an item's display label by id, used in announcements. */
  getItemLabel?: (id: string) => string | undefined;
  children: ReactNode;
}

const KEYBOARD_HINT_ID = "sortable-keyboard-instructions";

export function SortableList({
  ids,
  onReorder,
  itemTypeLabel = "item",
  getItemLabel,
  children,
}: SortableListProps) {
  const sensors = useSensors(
    // 8px activation distance keeps tap-to-expand on accordions usable while
    // still allowing a deliberate drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const labelOf = (id: string) => getItemLabel?.(id) || id;

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{
        screenReaderInstructions: {
          draggable: `To pick up a ${itemTypeLabel}, press space or enter while focused on its drag handle. While dragging, use the arrow keys to move it up or down. Press space or enter again to drop it in the new position. Press escape to cancel.`,
        },
        announcements: {
          onDragStart({ active }) {
            const i = ids.indexOf(String(active.id)) + 1;
            return `Picked up ${itemTypeLabel} "${labelOf(String(active.id))}". It is in position ${i} of ${ids.length}. Use the arrow keys to move it.`;
          },
          onDragOver({ active, over }) {
            if (!over) return;
            const i = ids.indexOf(String(over.id)) + 1;
            return `${itemTypeLabel} "${labelOf(String(active.id))}" is now over position ${i} of ${ids.length}.`;
          },
          onDragEnd({ active, over }) {
            if (!over) {
              return `Reorder cancelled. ${itemTypeLabel} "${labelOf(String(active.id))}" returned to its original position.`;
            }
            const i = ids.indexOf(String(over.id)) + 1;
            return `Dropped ${itemTypeLabel} "${labelOf(String(active.id))}" at position ${i} of ${ids.length}.`;
          },
          onDragCancel({ active }) {
            return `Reorder cancelled. ${itemTypeLabel} "${labelOf(String(active.id))}" returned to its original position.`;
          },
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {/* Visually-hidden global hint, referenced via aria-describedby on each handle. */}
        <span id={KEYBOARD_HINT_ID} className="sr-only">
          Press space to pick up. Use arrow keys to move. Space to drop. Escape to cancel.
        </span>
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
  /** Marks this row as the currently expanded/open item — shows a badge + dot. */
  isOpen?: boolean;
}

/**
 * Wraps an item with a left-aligned drag handle. The handle is the only
 * draggable surface — taps elsewhere (e.g. the Accordion trigger) work
 * normally. Keyboard users can focus the handle and use space + arrows to
 * reorder; a visual tooltip appears on focus to make this obvious.
 *
 * When `isOpen` is true, an "Open" pill is shown next to the handle so
 * users keep track of which row is expanded — especially useful while
 * dragging or scanning a long list.
 */
export function SortableRow({ id, children, className, handleLabel = "Reorder", isOpen = false }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const [focused, setFocused] = useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging || focused ? 30 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex items-stretch ${className ?? ""}
        ${isDragging ? "shadow-lg ring-2 ring-primary/40 rounded-2xl" : ""}
        ${isOpen && !isDragging ? "ring-1 ring-primary/40 rounded-2xl" : ""}`}
    >
      <button
        type="button"
        aria-label={isOpen ? `${handleLabel} (currently open)` : handleLabel}
        aria-describedby={KEYBOARD_HINT_ID}
        aria-roledescription="sortable"
        title={isOpen ? "Currently open · drag or press Space then arrows to reorder" : "Drag, or press Space then arrows to reorder"}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...attributes}
        {...listeners}
        className={`relative flex shrink-0 items-center justify-center px-1.5 cursor-grab active:cursor-grabbing touch-none rounded-l-2xl transition-colors outline-none
          ${focused || isDragging
            ? "bg-primary/15 text-primary ring-2 ring-primary/60 ring-offset-1 ring-offset-background"
            : isOpen
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/60"}`}
      >
        <GripVertical className="h-4 w-4" />
        {/* Tiny pulsing dot marking the open row at-a-glance. */}
        {isOpen && (
          <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
          </span>
        )}
      </button>

      {/* "Open" pill — visible at all times for the open row, so users always
          know which item is expanded inside the sortable list. */}
      {isOpen && !isDragging && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-6 top-1/2 z-30 -translate-y-1/2 whitespace-nowrap rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground shadow-sm"
        >
          Open
        </span>
      )}

      {/* Visual keyboard hint — appears when handle is focused via keyboard. */}
      {focused && !isDragging && (
        <div
          role="tooltip"
          className="pointer-events-none absolute left-7 top-1/2 z-40 -translate-y-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-2.5 py-1.5 text-[11px] font-medium text-popover-foreground shadow-md animate-fade-in"
        >
          <kbd className="rounded border border-border bg-muted px-1 font-mono">Space</kbd>
          <span className="mx-1 text-muted-foreground">pick up</span>
          <span aria-hidden="true">·</span>
          <kbd className="ml-1 rounded border border-border bg-muted px-1 font-mono">↑↓</kbd>
          <span className="mx-1 text-muted-foreground">move</span>
          <span aria-hidden="true">·</span>
          <kbd className="ml-1 rounded border border-border bg-muted px-1 font-mono">Esc</kbd>
          <span className="ml-1 text-muted-foreground">cancel</span>
        </div>
      )}

      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
