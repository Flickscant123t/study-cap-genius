import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bold, 
  Italic, 
  Code, 
  List, 
  ListOrdered, 
  Heading1,
  Heading2,
  Link,
  Quote,
  Eye,
  Edit
} from "lucide-react";
import { MarkdownPreview } from "./MarkdownPreview";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MarkdownEditor({ value, onChange, placeholder, className }: MarkdownEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");

  const insertMarkdown = (prefix: string, suffix: string = "") => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + prefix + selectedText + suffix + value.substring(end);
    onChange(newText);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  const toolbarButtons = [
    { icon: Bold, action: () => insertMarkdown("**", "**"), tooltip: "Bold" },
    { icon: Italic, action: () => insertMarkdown("*", "*"), tooltip: "Italic" },
    { icon: Code, action: () => insertMarkdown("`", "`"), tooltip: "Inline Code" },
    { icon: Heading1, action: () => insertMarkdown("# "), tooltip: "Heading 1" },
    { icon: Heading2, action: () => insertMarkdown("## "), tooltip: "Heading 2" },
    { icon: List, action: () => insertMarkdown("- "), tooltip: "Bullet List" },
    { icon: ListOrdered, action: () => insertMarkdown("1. "), tooltip: "Numbered List" },
    { icon: Quote, action: () => insertMarkdown("> "), tooltip: "Quote" },
    { icon: Link, action: () => insertMarkdown("[", "](url)"), tooltip: "Link" },
  ];

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30">
        {toolbarButtons.map((btn, i) => (
          <Button
            key={i}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={btn.action}
            title={btn.tooltip}
          >
            <btn.icon className="h-4 w-4" />
          </Button>
        ))}
        
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant={mode === "write" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("write")}
            className="h-8"
          >
            <Edit className="h-4 w-4 mr-1" />
            Write
          </Button>
          <Button
            variant={mode === "preview" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("preview")}
            className="h-8"
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
        </div>
      </div>

      {/* Editor/Preview */}
      <div className="flex-1 overflow-hidden">
        {mode === "write" ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Write your notes using Markdown, LaTeX ($...$), or code blocks..."}
            className="w-full h-full resize-none border-none rounded-none focus-visible:ring-0 font-mono text-sm"
          />
        ) : (
          <div className="h-full overflow-auto p-4">
            <MarkdownPreview content={value} />
          </div>
        )}
      </div>
    </div>
  );
}
