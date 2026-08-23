import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, dir, ...props }, ref) => {
  return (
    <textarea
      // dir="auto" lets the browser detect direction per-line from the first
      // strong character, so mixed Arabic + English content stays readable
      // (URLs, numbers, English brand names inline in Arabic sentences).
      dir={dir || "auto"}
      className={cn(
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm bidi-plaintext",
        className
      )}
      ref={ref}
      {...props} />
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
