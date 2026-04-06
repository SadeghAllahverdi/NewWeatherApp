import { LiquidGlass as NormalGlass } from "@liquidglass/react";
import type { WeatherData } from "../assets/api/WeatherApi";
import {
  icons,
  getBeaufortIcon,
  getWeatherIcon,
  getWeatherDescription,
  getDewPoint,
} from "../assets/api/Icons";

/**
 * Interface defining the expected props for the CurrentWeather component.
 * @property info - The current weather object from the API response.
 * @property cityName - The name of the city to display at the center of the card.
 */
interface CurrentWeatherProps {
  info?: WeatherData["current"];
  cityName: string;
}

export default function CurrentWeather({ info, cityName }: Readonly<CurrentWeatherProps>) {
  
  // Display a loading state if the weather data hasn't been fetched yet
  if (!info) {
    return (
      <NormalGlass borderRadius={20} blur={2} contrast={1.15} brightness={1.05} saturation={1.1} elasticity={0.3}>
        <div className="px-8 py-4 text-white text-lg">Loading...</div>
      </NormalGlass>
    );
  }

  return (
    <NormalGlass borderRadius={20} blur={4} contrast={1.1} brightness={1.05} saturation={1.8} elasticity={0.3}>
      <div className="w-full h-full flex flex-col gap-6 p-4 text-white text-shadow-md">
        
        {/* UPPER SECTION: Responsive Weather Overview
            Mobile: Stacked vertically | Desktop: Horizontal row
        */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-2">
          
          {/* 1. TEMPERATURE & DESCRIPTION (Left on Desktop / Top on Mobile)
              - Displays main temperature, 'feels like' value, and weather status text.
          */}
          <div className="flex flex-col items-center md:items-start order-2 md:order-1 transition-transform hover:scale-105">
            <div className="flex items-start">
              <span className="text-6xl md:text-8xl font-bold">{info.temperature_2m.toFixed(1)}</span>
              <span className="text-2xl md:text-3xl mt-2 md:mt-4">°C</span>
            </div>
            <div className="text-center md:text-left mt-1">
              <p className="text-xs md:text-sm text-white/70 font-light">
                Feels like {info.apparent_temperature.toFixed(1)}°C
              </p>
              <p className="text-sm md:text-base font-medium">
                {getWeatherDescription(info.weather_code)}
              </p>
            </div>
          </div>

          {/* 2. CITY NAME (Center on Desktop / Middle on Mobile)
              - Strategically placed between Temp and Icon on mobile to maintain design balance.
          */}
          <div className="order-1 md:order-2">
            <h2 className="text-4xl md:text-6xl font-black capitalize tracking-tighter text-center drop-shadow-lg">
              {cityName}
            </h2>
          </div>

          {/* 3. MAIN WEATHER ICON (Right on Desktop / Bottom on Mobile)
              - Dynamic icon based on day/night status and weather code.
          */}
          <div className="order-3 transition-transform hover:rotate-3">
            <figure className="w-32 h-32 md:w-48 md:h-48">
              <img
                src={getWeatherIcon(info.is_day, info.weather_code)}
                alt="weather icon"
                className="w-full h-full object-contain filter drop-shadow-2xl"
              />
            </figure>
          </div>
        </div>

        {/* LOWER SECTION: Detailed Metrics Grid
            - Displays additional weather data: Humidity (Dew Point), Wind Speed, and Pressure.
        */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* HUMIDITY / DEW POINT METRIC */}
          <div className="flex items-center justify-between p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/5">
            <span className="text-base sm:text-lg font-bold">
              {getDewPoint(info.temperature_2m, info.relative_humidity_2m).toFixed(1)}°C
            </span>
            <img src={icons.metric.humidity} alt="humidity" className="w-9 h-9 sm:w-14 sm:h-14" />
          </div>

          {/* WIND SPEED & BEAUFORT SCALE ICON */}
          <div className="flex items-center justify-between p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/5">
            <div className="text-left">
              <span className="text-base sm:text-lg font-bold block leading-none">{info.wind_speed_10m.toFixed(1)}</span>
              <span className="text-base sm:text-lg text-white/60">km/h</span>
            </div>
            <img src={getBeaufortIcon(info.wind_speed_10m)} alt="wind" className="w-9 h-9 sm:w-14 sm:h-14" />
          </div>

          {/* ATMOSPHERIC PRESSURE METRIC */}
          <div className="flex items-center justify-between p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/5">
            <div className="text-left">
              <span className="text-base sm:text-lg font-bold block leading-none">{info.pressure_msl.toFixed(0)}</span>
              <span className="text-base sm:text-lg text-white/60">hPa</span>
            </div>
            <img src={icons.metric.barometer} alt="pressure" className="w-9 h-9 sm:w-14 sm:h-14"/>
          </div>
        </div>

      </div>
    </NormalGlass>
  );
}