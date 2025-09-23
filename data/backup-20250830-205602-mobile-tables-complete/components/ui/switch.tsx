"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ea078b]/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#27aae1] data-[state=checked]:to-[#ea078b] data-[state=unchecked]:bg-slate-200 hover:data-[state=unchecked]:bg-slate-300 shadow-sm hover:shadow-md",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block h-6 w-6 rounded-full bg-white shadow-lg ring-0 transition-all duration-300 ease-in-out data-[state=checked]:translate-x-7 data-[state=unchecked]:translate-x-0.5 data-[state=checked]:shadow-xl data-[state=unchecked]:shadow-md hover:scale-105"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
