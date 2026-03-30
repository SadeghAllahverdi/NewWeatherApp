import * as React from "react"
import { ResponsiveContainer, Tooltip } from "recharts"
import type { TooltipProps } from "recharts"
import { cn } from "../../lib/utils"

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode
    color?: string
    unit?: string
  }
}

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null)

export function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) throw new Error("useChart must be used within a <ChartContainer />")
  return context
}

export function ChartContainer({
  config,
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ReactElement
}) {
  const colorVars = Object.entries(config).reduce<React.CSSProperties>((acc, [key, val]) => {
    if (val.color) (acc as Record<string, string>)[`--color-${key}`] = val.color
    return acc
  }, {})

  return (
    <ChartContext.Provider value={{ config }}>
      <div className={cn("w-full", className)} style={colorVars} {...props}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

export const ChartTooltip = Tooltip

export function ChartTooltipContent({
  active,
  payload,
  label,
  className,
}: TooltipProps<number, string> & { className?: string }) {
  const { config } = useChart()
  if (!active || !payload?.length) return null

  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-black/70 px-3 py-2 shadow-lg backdrop-blur-md text-xs",
        className
      )}
    >
      <p className="mb-1.5 font-medium text-white/80">{label}</p>
      {payload.map((item) => {
        const key = item.dataKey as string
        const cfg = config[key]
        return (
          <div key={key} className="flex items-center gap-2 py-0.5">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ background: item.color }}
            />
            <span className="text-white/60">{cfg?.label ?? key}</span>
            <span className="ml-auto font-medium text-white pl-3">
              {item.value}{cfg?.unit ?? ""}
            </span>
          </div>
        )
      })}
    </div>
  )
}
