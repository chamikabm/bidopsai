"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "rounded-md border border-border bg-popover text-popover-foreground p-3 shadow-md",
        className
      )}
      classNames={classNames}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }