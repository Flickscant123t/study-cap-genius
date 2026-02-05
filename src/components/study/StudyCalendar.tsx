import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StudyBlock, useStudyBlocks } from "@/hooks/useStudyBlocks";
import { useTasks } from "@/hooks/useTasks";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Loader2,
  Check,
  X,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  addHours,
  parseISO,
  differenceInMinutes,
} from "date-fns";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useToast } from "@/hooks/use-toast";

interface StudyCalendarProps {
  onOptimize: () => void;
  optimizing: boolean;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM
const HOUR_HEIGHT = 60; // pixels per hour

const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f97316",
  low: "#3b82f6",
};

export function StudyCalendar({ onOptimize, optimizing }: StudyCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const { blocks, updateBlock, deleteBlock, createBlock } = useStudyBlocks();
  const { tasks } = useTasks();
  const { toast } = useToast();

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getBlocksForDay = (date: Date) => {
    return blocks.filter((b) => isSameDay(parseISO(b.start_time), date));
  };

  const getBlockPosition = (block: StudyBlock) => {
    const start = parseISO(block.start_time);
    const end = parseISO(block.end_time);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const duration = differenceInMinutes(end, start) / 60;
    
    return {
      top: (startHour - 7) * HOUR_HEIGHT,
      height: duration * HOUR_HEIGHT,
    };
  };

  const getWorkloadLevel = (date: Date) => {
    const dayBlocks = getBlocksForDay(date);
    const totalHours = dayBlocks.reduce((acc, b) => {
      const start = parseISO(b.start_time);
      const end = parseISO(b.end_time);
      return acc + differenceInMinutes(end, start) / 60;
    }, 0);

    if (totalHours >= 6) return "high";
    if (totalHours >= 3) return "medium";
    if (totalHours > 0) return "low";
    return "none";
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const blockId = result.draggableId;
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return;

    const newDayIndex = parseInt(result.destination.droppableId.split("-")[1]);
    const newDate = days[newDayIndex];

    const originalStart = parseISO(block.start_time);
    const originalEnd = parseISO(block.end_time);
    const duration = differenceInMinutes(originalEnd, originalStart);

    const newStart = new Date(newDate);
    newStart.setHours(originalStart.getHours(), originalStart.getMinutes());
    const newEnd = new Date(newStart.getTime() + duration * 60000);

    await updateBlock(blockId, {
      start_time: newStart.toISOString(),
      end_time: newEnd.toISOString(),
    });

    toast({ title: "Block moved", description: `Moved to ${format(newDate, "EEEE")}` });
  };

  const handleAddBlock = async (date: Date, hour: number) => {
    const startTime = new Date(date);
    startTime.setHours(hour, 0, 0, 0);
    const endTime = addHours(startTime, 1);

    await createBlock({
      title: "New Study Block",
      subject: null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      color: "#3b82f6",
      task_id: null,
      study_plan_id: null,
      is_ai_generated: false,
      completed: false,
    });
  };

  const toggleBlockComplete = async (blockId: string, completed: boolean) => {
    await updateBlock(blockId, { completed: !completed });
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold min-w-[200px] text-center">
              {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentWeek(new Date())}
          >
            Today
          </Button>
        </div>

        <Button variant="hero" onClick={onOptimize} disabled={optimizing}>
          {optimizing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          AI Optimize
        </Button>
      </div>

      {/* Priority Legend */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <span className="text-muted-foreground">Workload:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-red-500/30" />
          <span>Heavy</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-orange-500/30" />
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-500/30" />
          <span>Light</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="border border-border rounded-lg overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b border-border">
            <div className="p-2 text-xs font-medium text-muted-foreground bg-muted/50">
              Time
            </div>
            {days.map((day, i) => {
              const workload = getWorkloadLevel(day);
              return (
                <div
                  key={i}
                  className={cn(
                    "p-2 text-center border-l border-border",
                    workload === "high" && "bg-red-500/20",
                    workload === "medium" && "bg-orange-500/20",
                    workload === "low" && "bg-blue-500/20",
                    isSameDay(day, new Date()) && "bg-primary/10"
                  )}
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {format(day, "EEE")}
                  </p>
                  <p
                    className={cn(
                      "text-lg font-semibold",
                      isSameDay(day, new Date()) && "text-primary"
                    )}
                  >
                    {format(day, "d")}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time Grid */}
          <div className="relative grid grid-cols-8" style={{ height: HOURS.length * HOUR_HEIGHT }}>
            {/* Time Labels */}
            <div className="bg-muted/30">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-border text-xs text-muted-foreground px-2 py-1"
                  style={{ height: HOUR_HEIGHT }}
                >
                  {format(new Date().setHours(hour), "h a")}
                </div>
              ))}
            </div>

            {/* Day Columns */}
            {days.map((day, dayIndex) => (
              <Droppable key={dayIndex} droppableId={`day-${dayIndex}`}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "relative border-l border-border",
                      snapshot.isDraggingOver && "bg-primary/5"
                    )}
                  >
                    {/* Hour slots */}
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="border-b border-border hover:bg-muted/50 cursor-pointer group"
                        style={{ height: HOUR_HEIGHT }}
                        onClick={() => handleAddBlock(day, hour)}
                      >
                        <Plus className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 m-2" />
                      </div>
                    ))}

                    {/* Study Blocks */}
                    {getBlocksForDay(day).map((block, blockIndex) => {
                      const position = getBlockPosition(block);
                      return (
                        <Draggable
                          key={block.id}
                          draggableId={block.id}
                          index={blockIndex}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                "absolute left-1 right-1 rounded-lg p-2 text-xs text-white shadow-sm overflow-hidden",
                                block.completed && "opacity-50",
                                snapshot.isDragging && "shadow-lg"
                              )}
                              style={{
                                ...provided.draggableProps.style,
                                top: position.top,
                                height: Math.max(position.height, 30),
                                backgroundColor: block.color || "#3b82f6",
                              }}
                            >
                              <div className="flex items-start gap-1">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab opacity-50 hover:opacity-100"
                                >
                                  <GripVertical className="w-3 h-3" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {block.title}
                                  </p>
                                  {block.subject && (
                                    <p className="opacity-75 truncate">
                                      {block.subject}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleBlockComplete(block.id, block.completed);
                                    }}
                                    className="p-1 rounded hover:bg-white/20"
                                  >
                                    {block.completed ? (
                                      <Check className="w-3 h-3" />
                                    ) : (
                                      <div className="w-3 h-3 border border-white rounded" />
                                    )}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteBlock(block.id);
                                    }}
                                    className="p-1 rounded hover:bg-white/20"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                              {block.is_ai_generated && (
                                <Sparkles className="absolute bottom-1 right-1 w-3 h-3 opacity-50" />
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </div>
      </DragDropContext>
    </Card>
  );
}
