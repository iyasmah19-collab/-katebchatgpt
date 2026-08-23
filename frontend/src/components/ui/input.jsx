import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, dir, ...props }, ref) => {
  // dir="auto" — direction is detected from the first strong character.
  // Skip auto-direction on non-text types (email/password/number/url) so the
  // caret/placeholder stays in the expected place. Caller can still override.
  const skipAuto = ["email", "password", "number", "tel", "url", "search"].includes(type);
  return (
    <input
      type={type}
      dir={dir || (skipAuto ? undefined : "auto")}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        !skipAuto && "bidi-plaintext",
        className
      )}
      ref={ref}
      {...props} />
  );
})
Input.displayName = "Input"

export { Input }
