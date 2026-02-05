import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MindMapViewProps {
  content: string;
  title: string;
}

interface Node {
  id: string;
  text: string;
  level: number;
  children: Node[];
}

export function MindMapView({ content, title }: MindMapViewProps) {
  const nodes = useMemo(() => {
    const lines = content.split("\n");
    const rootNode: Node = { id: "root", text: title, level: 0, children: [] };
    const stack: Node[] = [rootNode];

    lines.forEach((line, index) => {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        const node: Node = { id: `node-${index}`, text, level, children: [] };

        // Find parent
        while (stack.length > 1 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        stack[stack.length - 1].children.push(node);
        stack.push(node);
      }
    });

    return rootNode;
  }, [content, title]);

  const getNodeColor = (level: number) => {
    const colors = [
      "bg-primary text-primary-foreground",
      "bg-blue-500 text-white",
      "bg-green-500 text-white",
      "bg-purple-500 text-white",
      "bg-orange-500 text-white",
      "bg-pink-500 text-white",
    ];
    return colors[level % colors.length];
  };

  const renderNode = (node: Node, parentAngle: number = 0, depth: number = 0) => {
    const hasChildren = node.children.length > 0;
    const angleStep = hasChildren ? 360 / node.children.length : 0;

    return (
      <div key={node.id} className="relative">
        <div
          className={cn(
            "px-4 py-2 rounded-xl shadow-md text-center font-medium text-sm max-w-[200px]",
            getNodeColor(depth)
          )}
        >
          {node.text}
        </div>

        {hasChildren && (
          <div className="relative mt-8">
            <div className="flex flex-wrap justify-center gap-8">
              {node.children.map((child, index) => (
                <div key={child.id} className="flex flex-col items-center">
                  {/* Connection line */}
                  <div className="w-px h-6 bg-border" />
                  {renderNode(child, angleStep * index, depth + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!content?.trim()) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Add headings (# H1, ## H2, etc.) to your note to generate a mind map.
        </p>
      </Card>
    );
  }

  if (nodes.children.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          No headings found. Use # for H1, ## for H2, etc. to create structure.
        </p>
      </Card>
    );
  }

  return (
    <div className="p-8 overflow-auto">
      <div className="flex flex-col items-center min-w-max">
        {renderNode(nodes)}
      </div>
    </div>
  );
}
