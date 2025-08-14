import * as React from "react";

export const Button = React.forwardRef(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={`inline-flex items-center justify-center rounded-md bg-white text-black font-semibold px-4 py-2 hover:opacity-90 transition ${className}`}
    {...props}
  />
));
Button.displayName = "Button";
