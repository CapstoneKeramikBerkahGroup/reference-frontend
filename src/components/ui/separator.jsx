import React from "react";
import { cn } from "@/lib/utils";

const Separator = ({ className, orientation = "horizontal", decorative = true, ...props }) => (
  <div
    role={decorative ? "presentation" : "separator"}
    aria-orientation={orientation}
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
      className
    )}
    {...props}
  />
);

export { Separator };
