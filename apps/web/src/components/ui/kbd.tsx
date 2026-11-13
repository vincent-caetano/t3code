import type * as React from "react";

import { cn } from "~/lib/utils";

function Kbd({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"kbd"> & {
  /**
   * `outline` draws a physical key, so the hint stays distinct inside surrounding text.
   * `inherit` takes the parent's text color, for hints inside filled buttons.
   */
  variant?: "default" | "outline" | "inherit";
}) {
  return (
    <kbd
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 select-none items-center justify-center gap-1 rounded px-1 font-medium font-sans text-xs [&_svg:not([class*='size-'])]:size-3",
        variant === "outline" &&
          "border border-b-2 border-foreground/15 px-1.5 text-muted-foreground",
        variant === "default" && "bg-foreground/[0.07] text-muted-foreground",
        variant === "inherit" && "bg-current/15 opacity-80",
        className,
      )}
      data-slot="kbd"
      {...props}
    />
  );
}

function KbdGroup({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn("inline-flex items-center gap-1", className)}
      data-slot="kbd-group"
      {...props}
    />
  );
}

export { Kbd, KbdGroup };
