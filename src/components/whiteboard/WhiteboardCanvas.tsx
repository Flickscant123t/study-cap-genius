import { useRef, useEffect, useState, useCallback } from "react";
import { Canvas, PencilBrush, Rect, Ellipse, Line, IText, FabricObject } from "fabric";
import { cn } from "@/lib/utils";
import {
  Pencil,
  Eraser,
  MousePointer2,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Type,
  StickyNote,
  ZoomIn,
  ZoomOut,
  Move,
  Trash2,
  Undo,
  Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Tool = "select" | "draw" | "eraser" | "rectangle" | "circle" | "line" | "arrow" | "text" | "sticky" | "pan";

interface WhiteboardCanvasProps {
  whiteboardId: string;
  initialData?: string;
  onSave: (data: string) => void;
}

const COLORS = [
  "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308", 
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"
];

export default function WhiteboardCanvas({ whiteboardId, initialData, onSave }: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [zoom, setZoom] = useState(100);
  const [isPanning, setIsPanning] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isLoadingRef = useRef(false);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = new Canvas(canvasRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: "#ffffff",
      selection: true,
    });

    fabricRef.current = canvas;

    // Load initial data
    if (initialData) {
      isLoadingRef.current = true;
      canvas.loadFromJSON(JSON.parse(initialData)).then(() => {
        canvas.renderAll();
        isLoadingRef.current = false;
      });
    }

    // Handle resize
    const handleResize = () => {
      canvas.setDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
      canvas.renderAll();
    };

    window.addEventListener("resize", handleResize);

    // Save on changes
    const saveCanvas = () => {
      if (isLoadingRef.current) return;
      const json = JSON.stringify(canvas.toJSON());
      onSave(json);
      
      // Add to history
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        return [...newHistory, json];
      });
      setHistoryIndex(prev => prev + 1);
    };

    canvas.on("object:added", saveCanvas);
    canvas.on("object:modified", saveCanvas);
    canvas.on("object:removed", saveCanvas);

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.dispose();
    };
  }, [whiteboardId]);

  // Handle tool changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = activeTool === "draw" || activeTool === "eraser";
    canvas.selection = activeTool === "select";

    if (activeTool === "draw") {
      const brush = new PencilBrush(canvas);
      brush.color = strokeColor;
      brush.width = strokeWidth;
      canvas.freeDrawingBrush = brush;
    } else if (activeTool === "eraser") {
      const brush = new PencilBrush(canvas);
      brush.color = "#ffffff";
      brush.width = strokeWidth * 3;
      canvas.freeDrawingBrush = brush;
    }

    // Pan mode
    if (activeTool === "pan") {
      canvas.defaultCursor = "grab";
      canvas.hoverCursor = "grab";
    } else {
      canvas.defaultCursor = "default";
      canvas.hoverCursor = "move";
    }
  }, [activeTool, strokeColor, strokeWidth]);

  // Handle canvas click for shapes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let activeShape: FabricObject | null = null;
    let lastPanX = 0;
    let lastPanY = 0;

    const handleMouseDown = (opt: any) => {
      const pointer = canvas.getViewportPoint(opt.e);
      startX = pointer.x;
      startY = pointer.y;

      if (activeTool === "pan") {
        setIsPanning(true);
        lastPanX = opt.e.clientX;
        lastPanY = opt.e.clientY;
        canvas.defaultCursor = "grabbing";
        return;
      }

      if (["rectangle", "circle", "line", "arrow"].includes(activeTool)) {
        isDrawing = true;

        if (activeTool === "rectangle") {
          activeShape = new Rect({
            left: startX,
            top: startY,
            width: 0,
            height: 0,
            fill: "transparent",
            stroke: strokeColor,
            strokeWidth: strokeWidth,
          });
        } else if (activeTool === "circle") {
          activeShape = new Ellipse({
            left: startX,
            top: startY,
            rx: 0,
            ry: 0,
            fill: "transparent",
            stroke: strokeColor,
            strokeWidth: strokeWidth,
          });
        } else if (activeTool === "line" || activeTool === "arrow") {
          activeShape = new Line([startX, startY, startX, startY], {
            stroke: strokeColor,
            strokeWidth: strokeWidth,
          });
        }

        if (activeShape) {
          canvas.add(activeShape);
        }
      } else if (activeTool === "text") {
        const text = new IText("Click to edit", {
          left: startX,
          top: startY,
          fontSize: 18,
          fill: strokeColor,
          fontFamily: "Plus Jakarta Sans, sans-serif",
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        setActiveTool("select");
      } else if (activeTool === "sticky") {
        const sticky = new Rect({
          left: startX,
          top: startY,
          width: 150,
          height: 150,
          fill: "#fef08a",
          stroke: "#eab308",
          strokeWidth: 1,
          rx: 4,
          ry: 4,
        });
        
        const stickyText = new IText("Note...", {
          left: startX + 10,
          top: startY + 10,
          fontSize: 14,
          fill: "#000000",
          fontFamily: "Plus Jakarta Sans, sans-serif",
          width: 130,
        });
        
        canvas.add(sticky);
        canvas.add(stickyText);
        canvas.setActiveObject(stickyText);
        stickyText.enterEditing();
        setActiveTool("select");
      }
    };

    const handleMouseMove = (opt: any) => {
      if (activeTool === "pan" && isPanning) {
        const deltaX = opt.e.clientX - lastPanX;
        const deltaY = opt.e.clientY - lastPanY;
        
        const vpt = canvas.viewportTransform!;
        vpt[4] += deltaX;
        vpt[5] += deltaY;
        canvas.requestRenderAll();
        
        lastPanX = opt.e.clientX;
        lastPanY = opt.e.clientY;
        return;
      }

      if (!isDrawing || !activeShape) return;

      const pointer = canvas.getViewportPoint(opt.e);
      const width = pointer.x - startX;
      const height = pointer.y - startY;

      if (activeTool === "rectangle") {
        (activeShape as Rect).set({
          width: Math.abs(width),
          height: Math.abs(height),
          left: width < 0 ? pointer.x : startX,
          top: height < 0 ? pointer.y : startY,
        });
      } else if (activeTool === "circle") {
        (activeShape as Ellipse).set({
          rx: Math.abs(width) / 2,
          ry: Math.abs(height) / 2,
          left: startX,
          top: startY,
        });
      } else if (activeTool === "line" || activeTool === "arrow") {
        (activeShape as Line).set({
          x2: pointer.x,
          y2: pointer.y,
        });
      }

      canvas.renderAll();
    };

    const handleMouseUp = () => {
      isDrawing = false;
      activeShape = null;
      
      if (activeTool === "pan") {
        setIsPanning(false);
        canvas.defaultCursor = "grab";
      }
    };

    canvas.on("mouse:down", handleMouseDown);
    canvas.on("mouse:move", handleMouseMove);
    canvas.on("mouse:up", handleMouseUp);

    return () => {
      canvas.off("mouse:down", handleMouseDown);
      canvas.off("mouse:move", handleMouseMove);
      canvas.off("mouse:up", handleMouseUp);
    };
  }, [activeTool, strokeColor, strokeWidth, isPanning]);

  const handleZoom = useCallback((delta: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const newZoom = Math.min(Math.max(zoom + delta, 25), 400);
    setZoom(newZoom);
    canvas.setZoom(newZoom / 100);
    canvas.renderAll();
  }, [zoom]);

  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const activeObjects = canvas.getActiveObjects();
    activeObjects.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
  }, []);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const canvas = fabricRef.current;
    if (!canvas) return;

    isLoadingRef.current = true;
    const newIndex = historyIndex - 1;
    canvas.loadFromJSON(JSON.parse(history[newIndex])).then(() => {
      canvas.renderAll();
      setHistoryIndex(newIndex);
      isLoadingRef.current = false;
    });
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const canvas = fabricRef.current;
    if (!canvas) return;

    isLoadingRef.current = true;
    const newIndex = historyIndex + 1;
    canvas.loadFromJSON(JSON.parse(history[newIndex])).then(() => {
      canvas.renderAll();
      setHistoryIndex(newIndex);
      isLoadingRef.current = false;
    });
  }, [history, historyIndex]);

  const tools = [
    { id: "select" as Tool, icon: MousePointer2, label: "Select" },
    { id: "draw" as Tool, icon: Pencil, label: "Draw" },
    { id: "eraser" as Tool, icon: Eraser, label: "Eraser" },
    { id: "text" as Tool, icon: Type, label: "Text" },
    { id: "sticky" as Tool, icon: StickyNote, label: "Sticky Note" },
    { id: "rectangle" as Tool, icon: Square, label: "Rectangle" },
    { id: "circle" as Tool, icon: Circle, label: "Circle" },
    { id: "line" as Tool, icon: Minus, label: "Line" },
    { id: "arrow" as Tool, icon: ArrowRight, label: "Arrow" },
    { id: "pan" as Tool, icon: Move, label: "Pan" },
  ];

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Toolbar */}
      <div className="h-14 border-b border-border bg-card flex items-center gap-2 px-4 overflow-x-auto">
        {/* Tools */}
        <div className="flex items-center gap-1 border-r border-border pr-3">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={activeTool === tool.id ? "default" : "ghost"}
              size="icon"
              className="h-9 w-9"
              onClick={() => setActiveTool(tool.id)}
              title={tool.label}
            >
              <tool.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>

        {/* Color Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" title="Color">
              <div
                className="w-5 h-5 rounded-full border-2 border-border"
                style={{ backgroundColor: strokeColor }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <div className="grid grid-cols-5 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 transition-all",
                    strokeColor === color ? "border-primary scale-110" : "border-border"
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setStrokeColor(color)}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Stroke Width */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 gap-2 px-3" title="Stroke Width">
              <div className="w-4 h-4 flex items-center justify-center">
                <div
                  className="rounded-full bg-foreground"
                  style={{ width: strokeWidth * 2, height: strokeWidth * 2 }}
                />
              </div>
              <span className="text-xs">{strokeWidth}px</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-4">
            <Slider
              value={[strokeWidth]}
              onValueChange={([value]) => setStrokeWidth(value)}
              min={1}
              max={20}
              step={1}
            />
          </PopoverContent>
        </Popover>

        <div className="border-l border-border pl-3 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={undo}
            disabled={historyIndex <= 0}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-destructive hover:text-destructive"
            onClick={deleteSelected}
            title="Delete Selected"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="ml-auto flex items-center gap-2 border-l border-border pl-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => handleZoom(-25)}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-12 text-center">{zoom}%</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => handleZoom(25)}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 overflow-hidden">
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
