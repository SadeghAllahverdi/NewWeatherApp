import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import type { WeatherData } from "../assets/api/WeatherApi"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./ui/chart"

interface HourlyWeatherProps {
  info?: WeatherData["hourly"]
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => globalThis.innerWidth < 768)
  useEffect(() => {
    const mq = globalThis.matchMedia("(max-width: 767px)")
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return isMobile
}

interface MetricChartProps {
  data: { time: string; value: number }[]
  config: ChartConfig
  dataKey: string
  gradientId: string
  color: string
  title: string
  description: string
  unit: string
  isMobile: boolean
}

function MetricChart({
  data,
  config,
  dataKey,
  gradientId,
  color,
  title,
  description,
  unit,
  isMobile,
}: Readonly<MetricChartProps>) {
  const values = data.map((d) => d.value)
  const min = Math.min(...values).toFixed(1)
  const max = Math.max(...values).toFixed(1)
  const trending = (values.at(-1) ?? 0) > (values.at(0) ?? 0)

  return (
    <Card className="flex flex-1 flex-col hover:scale-105 transition duration-500 ease-in-out">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="pb-0">
        <ChartContainer config={config} className="h-[180px] w-full">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ left: isMobile ? 4 : 12, right: isMobile ? 4 : 12 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={color} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={isMobile ? 5 : 2}
              tickFormatter={(v: string) => v}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Area
              dataKey={dataKey}
              type="natural"
              fill={`url(#${gradientId})`}
              fillOpacity={0.4}
              stroke={color}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>

      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 leading-none font-medium">
              {trending ? "Trending up" : "Trending down"}{" "}
              {trending
                ? <TrendingUp className="h-4 w-4" />
                : <TrendingDown className="h-4 w-4" />}
            </div>
            <div className="flex items-center gap-2 leading-none text-zinc-500">
              {min}{unit} — {max}{unit} over 24 h
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

export default function HourlyWeather({ info }: Readonly<HourlyWeatherProps>) {
  const isMobile = useIsMobile()

  if (!info) {
    return (
      <div className="w-full flex flex-col md:flex-row gap-5">
        {["Temperature", "Humidity", "Dew Point"].map((label) => (
          <Card key={label} className="flex-1 p-6 text-zinc-400">Loading {label}...</Card>
        ))}
      </div>
    )
  }

  const times = info.time.map((t) =>
    new Date(t).toLocaleString("de-DE", { hour: "2-digit", minute: "2-digit" })
  )

  const tempData  = times.map((time, i) => ({ time, value: Math.round(info.temperature_2m[i] * 10) / 10 }))
  const humidData = times.map((time, i) => ({ time, value: Math.round(info.relative_humidity_2m[i]) }))
  const dewData   = times.map((time, i) => ({ time, value: Math.round(info.dew_point_2m[i] * 10) / 10 }))

  return (
    <div className="w-full flex flex-col md:flex-row gap-5">
      <MetricChart
        data={tempData}
        config={{ value: { label: "Temperature", color: "#E52B50", unit: "°C" } } satisfies ChartConfig}
        dataKey="value"
        gradientId="fillTemperature"
        color="#E52B50"
        title="Temperature"
        description="Hourly temperature · °C"
        unit="°C"
        isMobile={isMobile}
      />
      <MetricChart
        data={humidData}
        config={{ value: { label: "Humidity", color: "#0CAFFF", unit: "%" } } satisfies ChartConfig}
        dataKey="value"
        gradientId="fillHumidity"
        color="#0CAFFF"
        title="Humidity"
        description="Relative humidity · %"
        unit="%"
        isMobile={isMobile}
      />
      <MetricChart
        data={dewData}
        config={{ value: { label: "Dew Point", color: "#C084FC", unit: "°C" } } satisfies ChartConfig}
        dataKey="value"
        gradientId="fillDew"
        color="#C084FC"
        title="Dew Point"
        description="Dew point temperature · °C"
        unit="°C"
        isMobile={isMobile}
      />
    </div>
  )
}
