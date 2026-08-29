import { AlertCircle, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SaveStatus } from "@/hooks/use-autosave";

export function SaveStatusIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;

  const config = {
    saving: { icon: Loader2, label: "Saving...", className: "text-muted-foreground animate-pulse" },
    saved: { icon: Check, label: "Saved", className: "text-success" },
    error: { icon: AlertCircle, label: "Failed to save", className: "text-destructive" },
  }[status];

  const Icon = config.icon;

  return (
    <span className={cn("flex items-center gap-1.5 text-xs font-medium", config.className)}>
      <Icon className={cn("size-3.5", status === "saving" && "animate-spin")} />
      {config.label}
    </span>
  );
}
