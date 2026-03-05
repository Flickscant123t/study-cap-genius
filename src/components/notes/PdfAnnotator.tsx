import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Pen,
  Highlighter,
  Type,
  Eraser,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  MousePointer2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import * as pdfjsLib from "pdfjs-dist";

// Set worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type Tool = "select" | "pen" | "highlighter" | "text" | "eraser";

interface Stroke {
  tool: Tool;
  color: string;
  width: number;
  opacity: number;
  points: { x: number; y: number }[];
  page: number;
}

interface TextAnnotation {
  text: string;
  x: number;
  y: number;
  page: number;
  color: string;
  fontSize: number;
}

export interface AnnotationData {
  strokes: Stroke[];
  texts: TextAnnotation[];
}

interface PdfAnnotatorProps {
  pdfUrl: string;
  annotations: AnnotationData;
  onSave: (annotations: AnnotationData) => void;
  saving?: boolean;
}

const COLORS = [
  "hsl(var(--foreground))",
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
];

export function PdfAnnotator({ pdfUrl, annotations, onSave, saving }: PdfAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [tool, setTool] = useState<Tool>("select");
  const [color, setColor] = useState(COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [strokes, setStrokes] = useState<Stroke[]>(annotations.strokes || []);
  const [texts, setTexts] = useState<TextAnnotation[]>(annotations.texts || []);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [undoStack, setUndoStack] = useState<AnnotationData[]>([]);
  const [redoStack, setRedoStack] = useState<AnnotationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });

  // Load PDF
  useEffect(() => {
    const loadPdf = async () => {
      setLoading(true);
      try {
        const doc = await pdfjsLib.getDocument(pdfUrl).promise;
        setPdfDoc(doc);
        setTotalPages(doc.numPages);
      } catch (err) {
        console.error("Failed to load PDF:", err);
      }
      setLoading(false);
    };
    loadPdf();
  }, [pdfUrl]);

  // Render current page
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;
    const page = await pdfDoc.getPage(currentPage);
    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    setPageSize({ width: viewport.width, height: viewport.height });

    // Also resize overlay
    if (overlayRef.current) {
      overlayRef.current.width = viewport.width;
      overlayRef.current.height = viewport.height;
    }

    await page.render({ canvasContext: ctx, viewport }).promise;
    renderAnnotations();
  }, [pdfDoc, currentPage, scale]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Re-render annotations when strokes/texts change
  useEffect(() => {
    renderAnnotations();
  }, [strokes, texts, currentPage, pageSize]);

  const renderAnnotations = () => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d")!;
    ctx.clearRect(0, 0, overlay.width, overlay.height);

    // Draw strokes for current page
    strokes
      .filter((s) => s.page === currentPage)
      .forEach((stroke) => {
        if (stroke.points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = stroke.tool === "highlighter" ? 0.35 : 1;
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

    // Draw text annotations
    texts
      .filter((t) => t.page === currentPage)
      .forEach((t) => {
        ctx.font = `${t.fontSize}px sans-serif`;
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
      });
  };

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent) => {
    const overlay = overlayRef.current;
    if (!overlay) return { x: 0, y: 0 };
    const rect = overlay.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * overlay.width,
      y: ((clientY - rect.top) / rect.height) * overlay.height,
    };
  };

  const pushUndo = () => {
    setUndoStack((prev) => [...prev.slice(-20), { strokes: [...strokes], texts: [...texts] }]);
    setRedoStack([]);
  };

  const handlePointerDown = (e: React.MouseEvent) => {
    if (tool === "select") return;
    if (tool === "text") {
      const point = getCanvasPoint(e);
      const text = prompt("Enter text:");
      if (text) {
        pushUndo();
        setTexts((prev) => [
          ...prev,
          { text, x: point.x, y: point.y, page: currentPage, color, fontSize: 16 },
        ]);
      }
      return;
    }
    if (tool === "eraser") {
      const point = getCanvasPoint(e);
      pushUndo();
      setStrokes((prev) =>
        prev.filter((s) => {
          if (s.page !== currentPage) return true;
          return !s.points.some(
            (p) => Math.hypot(p.x - point.x, p.y - point.y) < 15
          );
        })
      );
      return;
    }

    setIsDrawing(true);
    const point = getCanvasPoint(e);
    setCurrentStroke({
      tool,
      color,
      width: tool === "highlighter" ? strokeWidth * 4 : strokeWidth,
      opacity: tool === "highlighter" ? 0.35 : 1,
      points: [point],
      page: currentPage,
    });
  };

  const handlePointerMove = (e: React.MouseEvent) => {
    if (!isDrawing || !currentStroke) return;
    const point = getCanvasPoint(e);
    setCurrentStroke((prev) =>
      prev ? { ...prev, points: [...prev.points, point] } : null
    );

    // Live preview on overlay
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext("2d")!;
    const pts = [...currentStroke.points, point];
    if (pts.length < 2) return;
    // Re-render all + current
    renderAnnotations();
    ctx.beginPath();
    ctx.strokeStyle = currentStroke.color;
    ctx.lineWidth = currentStroke.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = currentStroke.tool === "highlighter" ? 0.35 : 1;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  const handlePointerUp = () => {
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);
    if (currentStroke.points.length > 1) {
      pushUndo();
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, { strokes: [...strokes], texts: [...texts] }]);
    setStrokes(last.strokes);
    setTexts(last.texts);
    setUndoStack((prev) => prev.slice(0, -1));
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, { strokes: [...strokes], texts: [...texts] }]);
    setStrokes(last.strokes);
    setTexts(last.texts);
    setRedoStack((prev) => prev.slice(0, -1));
  };

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: "select", icon: <MousePointer2 className="w-4 h-4" />, label: "Select" },
    { id: "pen", icon: <Pen className="w-4 h-4" />, label: "Pen" },
    { id: "highlighter", icon: <Highlighter className="w-4 h-4" />, label: "Highlighter" },
    { id: "text", icon: <Type className="w-4 h-4" />, label: "Text" },
    { id: "eraser", icon: <Eraser className="w-4 h-4" />, label: "Eraser" },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 border-b border-border bg-card flex-wrap">
        {/* Tools */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {tools.map((t) => (
            <Button
              key={t.id}
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-md",
                tool === t.id && "bg-primary text-primary-foreground"
              )}
              onClick={() => setTool(t.id)}
              title={t.label}
            >
              {t.icon}
            </Button>
          ))}
        </div>

        {/* Colors */}
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              className={cn(
                "w-6 h-6 rounded-full border-2 transition-transform",
                color === c ? "border-primary scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: c === "hsl(var(--foreground))" ? undefined : c }}
              onClick={() => setColor(c)}
            >
              {c === "hsl(var(--foreground))" && (
                <span className="block w-full h-full rounded-full bg-foreground" />
              )}
            </button>
          ))}
        </div>

        {/* Stroke Width */}
        <div className="flex items-center gap-2 min-w-[100px]">
          <Slider
            value={[strokeWidth]}
            onValueChange={([v]) => setStrokeWidth(v)}
            min={1}
            max={8}
            step={1}
            className="w-20"
          />
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Undo/Redo */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={undoStack.length === 0}>
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={redoStack.length === 0}>
          <Redo2 className="w-4 h-4" />
        </Button>

        <div className="h-6 w-px bg-border" />

        {/* Zoom */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <span className="text-xs text-muted-foreground min-w-[40px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale((s) => Math.min(3, s + 0.2))}>
          <ZoomIn className="w-4 h-4" />
        </Button>

        <div className="flex-1" />

        {/* Save */}
        <Button
          variant="hero"
          size="sm"
          onClick={() => onSave({ strokes, texts })}
          disabled={saving}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
          Save
        </Button>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted/50 flex items-start justify-center p-4"
      >
        <div className="relative shadow-lg rounded-sm">
          <canvas ref={canvasRef} className="block rounded-sm" />
          <canvas
            ref={overlayRef}
            className={cn(
              "absolute inset-0 rounded-sm",
              tool === "pen" || tool === "highlighter"
                ? "cursor-crosshair"
                : tool === "eraser"
                ? "cursor-cell"
                : tool === "text"
                ? "cursor-text"
                : "cursor-default"
            )}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
          />
        </div>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center justify-center gap-4 p-2 border-t border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage <= 1}
          onClick={() => setCurrentPage((p) => p - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
