import { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichDocumentEditorProps {
  initialContent: string;
  onChange: (html: string) => void;
  className?: string;
}

const TOOLBAR_GROUPS = [
  {
    items: [
      { icon: Undo2, command: "undo", label: "Undo" },
      { icon: Redo2, command: "redo", label: "Redo" },
    ],
  },
  {
    items: [
      { icon: Bold, command: "bold", label: "Bold" },
      { icon: Italic, command: "italic", label: "Italic" },
      { icon: Underline, command: "underline", label: "Underline" },
      { icon: Strikethrough, command: "strikeThrough", label: "Strikethrough" },
    ],
  },
  {
    items: [
      { icon: Heading1, command: "formatBlock", value: "H1", label: "Heading 1" },
      { icon: Heading2, command: "formatBlock", value: "H2", label: "Heading 2" },
      { icon: Heading3, command: "formatBlock", value: "H3", label: "Heading 3" },
      { icon: Type, command: "formatBlock", value: "P", label: "Paragraph" },
    ],
  },
  {
    items: [
      { icon: List, command: "insertUnorderedList", label: "Bullet List" },
      { icon: ListOrdered, command: "insertOrderedList", label: "Numbered List" },
      { icon: Quote, command: "formatBlock", value: "BLOCKQUOTE", label: "Quote" },
    ],
  },
  {
    items: [
      { icon: AlignLeft, command: "justifyLeft", label: "Align Left" },
      { icon: AlignCenter, command: "justifyCenter", label: "Align Center" },
      { icon: AlignRight, command: "justifyRight", label: "Align Right" },
    ],
  },
  {
    items: [
      { icon: Code, command: "formatBlock", value: "PRE", label: "Code Block" },
      { icon: Minus, command: "insertHorizontalRule", label: "Horizontal Rule" },
      {
        icon: Link,
        command: "createLink",
        label: "Insert Link",
        promptValue: true,
      },
    ],
  },
];

export function RichDocumentEditor({
  initialContent,
  onChange,
  className,
}: RichDocumentEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = useCallback(
    (command: string, value?: string, promptValue?: boolean) => {
      if (promptValue) {
        const url = prompt("Enter URL:");
        if (!url) return;
        document.execCommand(command, false, url);
      } else if (value) {
        document.execCommand(command, false, value);
      } else {
        document.execCommand(command, false);
      }
      editorRef.current?.focus();
      onChange(editorRef.current?.innerHTML || "");
    },
    [onChange]
  );

  const handleInput = useCallback(() => {
    onChange(editorRef.current?.innerHTML || "");
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Tab for indentation
      if (e.key === "Tab") {
        e.preventDefault();
        document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
        onChange(editorRef.current?.innerHTML || "");
      }
    },
    [onChange]
  );

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 p-2 border-b border-border bg-card flex-wrap sticky top-0 z-10">
        {TOOLBAR_GROUPS.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {gi > 0 && <div className="h-5 w-px bg-border mx-1" />}
            {group.items.map((btn) => (
              <Button
                key={btn.label}
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md"
                onClick={() =>
                  execCommand(btn.command, btn.value, btn.promptValue)
                }
                title={btn.label}
                type="button"
              >
                <btn.icon className="w-4 h-4" />
              </Button>
            ))}
          </div>
        ))}
      </div>

      {/* Document Page */}
      <div className="flex-1 overflow-auto bg-muted/30 flex justify-center py-8 px-4">
        <div className="w-full max-w-[816px] min-h-[1056px] bg-background shadow-lg rounded-sm border border-border/50 px-16 py-12">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className="outline-none min-h-full prose prose-sm dark:prose-invert max-w-none [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mt-6 [&>h1]:mb-4 [&>h1]:pb-2 [&>h1]:border-b [&>h1]:border-border [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mt-5 [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-4 [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:my-2 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:my-2 [&>blockquote]:border-l-4 [&>blockquote]:border-primary/50 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-muted-foreground [&>blockquote]:my-4 [&>pre]:bg-muted [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:font-mono [&>pre]:text-sm [&>hr]:my-6 [&>hr]:border-border"
            dangerouslySetInnerHTML={{ __html: initialContent }}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            spellCheck
          />
        </div>
      </div>
    </div>
  );
}
