import { SECTIONS } from "@/lib/cma-units";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown } from "lucide-react";

export function SectionOrderEditor({
  order, onChange, sections = SECTIONS,
}: { order: string[]; onChange: (next: string[]) => void; sections?: Record<string, { id: string; title: string }> }) {
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    const next = [...order];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  return (
    <ol className="space-y-2">
      {order.map((id, i) => (
        <li key={id} className="flex items-center justify-between rounded-lg border bg-card p-3">
          <div className="flex items-center gap-3">
            <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center">{i+1}</span>
            <span className="text-sm font-medium">{sections[id]?.title ?? id}</span>
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" disabled={i===0} onClick={() => move(i, -1)}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" disabled={i===order.length-1} onClick={() => move(i, 1)}>
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
        </li>
      ))}
    </ol>
  );
}
