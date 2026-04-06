import { useRef, useState, useEffect } from "react";
import getWeather from "./assets/api/WeatherApi.ts";
import type { WeatherData } from "./assets/api/WeatherApi.ts";

import SearchBar from "./components/SearchBar";
import CurrentWeather from "./components/CurrentWeather";
import { cityBackgroundImage } from "./assets/api/InitialLocationGuess.ts";

/** * TYPES DEFINITIONS
 */
type DailyWeather = {
  day: string;
  temp: number;
  icon: string;
};

type HourlyWeatherItem = {
  time: string;
  temp: number;
  icon: string;
};

/** * HELPER FUNCTIONS
 */

// Formats a date string/object into a short weekday name (e.g., "Mon")
const formatDay = (date: string | Date) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("en-US", { weekday: "short" });
};

// Formats a date string/object into a 24-hour time format (e.g., "14:00")
const formatHour = (date: string | Date) => {
  const d = date instanceof Date ? date : new Date(date);
  const hours = d.getHours();
  return `${hours < 10 ? "0" : ""}${hours}:00`;
};

// Returns a weather emoji based on the temperature value
const getWeatherEmoji = (temp: number) => {
  if (temp >= 30) return "☀️";
  if (temp >= 20) return "🌤️";
  if (temp >= 10) return "⛅";
  return "🌧️";
};

/** * COMPONENT: AnimatedIcon
 * Renders a weather emoji with specific CSS animations based on the icon type
 */
const AnimatedIcon = ({ icon, className = "" }: { icon: string; className?: string }) => {
  let animationClass = "";
  if (icon === "☀️") animationClass = "animate-spin animate-pulse duration-[10000ms]";
  else if (icon === "🌤️" || icon === "⛅") animationClass = "animate-bounce duration-[2000ms]";
  else if (icon === "🌧️") animationClass = "animate-pulse duration-[1500ms]";

  return (
    <span className={`inline-block filter drop-shadow-[0_2px_4px_rgba(255,255,255,0.2)] transition-transform duration-300 ${animationClass} ${className}`}>
      {icon}
    </span>
  );
};

export default function App() {
  // REFS: Used for DOM manipulation and drag-scroll logic
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // CORE WEATHER STATES
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [cityName, setCityName] = useState(""); 
  const [backgroundImageUrl, setBackgroundImageUrl] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI STATES: Sidebar visibility and input reset control
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0); 

  // SEARCH HISTORY STATE: Initialized from LocalStorage
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem("weatherSearchHistory");
    return saved ? JSON.parse(saved) : [];
  });

  // Sync search history with LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("weatherSearchHistory", JSON.stringify(searchHistory));
  }, [searchHistory]);

  // DRAG SCROLL STATE: Tracking mouse position for horizontal scrolling
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  /**
   * Main function to fetch weather data and update application state
   * @param name - The name of the city to search for
   */
  const handleSearch = async (name: string) => {
    try {
      setError(null);
      const weatherData = await getWeather(name);

      if (!weatherData) throw new Error("City not found");

      setWeather(weatherData);
      setCityName(name); 
      const newImageUrl = await cityBackgroundImage(name);
      setBackgroundImageUrl(newImageUrl);
      setHasSearched(true);
      
      // Update history: Add new city to the top and prevent duplicates
      setSearchHistory(prev => {
        const filtered = prev.filter(city => city.toLowerCase() !== name.toLowerCase());
        return [name, ...filtered].slice(0, 10); // Keep only the last 10 searches
      });

    } catch (err) {
      setError("City not found. Please check the spelling.");
      setHasSearched(false);
      setWeather(null);
      setCityName("");
      setTimeout(() => setError(null), 4000); // Clear error after 4 seconds
    }
  };

  /**
   * DRAG SCROLL LOGIC: Handlers for the horizontal hourly weather list
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    isDown.current = true;
    if (scrollRef.current) {
      startX.current = e.pageX - scrollRef.current.offsetLeft;
      scrollLeft.current = scrollRef.current.scrollLeft;
    }
  };
  const handleMouseLeave = () => (isDown.current = false);
  const handleMouseUp = () => (isDown.current = false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current); // Calculate drag distance
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  // Transform raw API data into formatted arrays for the UI
  const dailyArray = weather?.daily?.time.map((t, i) => {
    const temp = Math.round((weather.daily.temperature_2m_min[i] + weather.daily.temperature_2m_max[i]) / 2);
    return { day: formatDay(t), temp, icon: getWeatherEmoji(temp) };
  });

  const hourlyArray = weather?.hourly?.time.map((t, i) => {
    const temp = Math.round(weather.hourly.temperature_2m[i]);
    return { time: formatHour(t), temp, icon: getWeatherEmoji(temp) };
  });

  return (
    <div
      className="w-full min-h-screen md:h-screen font-[Roboto_Serif] relative overflow-hidden bg-center bg-cover bg-no-repeat transition-all duration-700"
      style={hasSearched ? { backgroundImage: `url(${backgroundImageUrl})` } : { backgroundColor: "#1e293b" }}
    >
      {/* SIDEBAR TOGGLE BUTTON */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-6 left-6 z-[60] text-white p-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/20 transition-all shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>
      </button>

      {/* SIDEBAR OVERLAY */}
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] transition-opacity duration-300 ${isSidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"}`} onClick={() => setIsSidebarOpen(false)}></div>

      {/* SIDEBAR MENU: Displaying search history */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-[#1e293b]/95 backdrop-blur-2xl border-r border-white/10 z-[100] transform transition-transform duration-500 shadow-2xl ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
            <h2 className="text-white text-xl font-bold tracking-wider">History</h2>
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {searchHistory.length === 0 ? <p className="text-gray-500 text-center mt-10">Empty</p> : (
              <ul className="space-y-3">
                {searchHistory.map((city, idx) => (
                  <li key={idx} onClick={() => { setResetKey(prev => prev + 1); handleSearch(city); setIsSidebarOpen(false); }} className="flex items-center gap-3 text-gray-300 hover:text-white hover:bg-white/10 p-3 rounded-xl cursor-pointer transition-all border border-transparent hover:border-white/5">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="capitalize text-lg font-medium">{city}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {searchHistory.length > 0 && <button onClick={() => setSearchHistory([])} className="mt-6 w-full py-3 text-sm text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/10">Clear</button>}
        </div>
      </div>

      {/* ERROR MESSAGE NOTIFICATION */}
      {error && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
          <div className="bg-red-500/30 backdrop-blur-xl border border-red-500/50 text-white px-8 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
            <span className="text-xl">⚠️</span><span className="font-bold text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* SEARCH BAR SECTION: Position adjusts based on whether a search has been performed */}
      <div ref={containerRef} className={`${hasSearched ? "absolute" : "fixed"} left-1/2 w-[90%] sm:w-4/5 md:w-2/3 lg:w-1/2 px-4 z-50 transition-all duration-1000 ${hasSearched ? "top-14 -translate-x-1/2 scale-90" : "top-[50vh] -translate-x-1/2 -translate-y-1/2 md:scale-110"}`}>
        <SearchBar key={resetKey} containerRef={containerRef} onSearch={handleSearch} setBackgroundImageUrl={setBackgroundImageUrl} />
      </div>

      {/* MAIN WEATHER CONTENT AREA */}
      <div className={`w-full flex flex-col items-center px-4 transition-all duration-700 ${hasSearched ? "opacity-100 mt-[110px] md:mt-30" : "opacity-0 pointer-events-none translate-y-10"}`}>
        
        {/* CURRENT WEATHER OVERVIEW CARD */}
        <div className="w-full max-w-6xl min-h-[350px] rounded-3xl bg-black/40 backdrop-blur-xl shadow-2xl p-6 flex flex-col justify-center items-center border border-white/5 mb-5 text-white overflow-hidden">
          <CurrentWeather info={weather?.current} cityName={cityName} />
        </div>

        {/* DAILY FORECAST SECTION */}
        <div className="justify-center w-full max-w-6xl rounded-3xl bg-black/40 backdrop-blur-xl shadow-2xl p-4 mb-4 flex flex-col md:flex-row gap-6 border border-white/5">
          {dailyArray?.map((day, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center w-full md:w-36 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
              <p className="text-sm font-medium text-gray-300">{day.day}</p>
              <p className="text-3xl my-2"><AnimatedIcon icon={day.icon} /></p>
              <p className="text-xl font-bold text-white">{day.temp}°C</p>
            </div>
          ))}
        </div>

        {/* HOURLY FORECAST SCROLLABLE LIST */}
        <div ref={scrollRef} onMouseDown={handleMouseDown} onMouseLeave={handleMouseLeave} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove} className="w-full max-w-6xl rounded-3xl bg-black/40 backdrop-blur-xl shadow-2xl p-5 flex gap-5 overflow-x-auto select-none cursor-grab active:cursor-grabbing border border-white/5 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
          {hourlyArray?.map((hour, idx) => (
            <div key={idx} className="shrink-0 flex flex-col items-center justify-between min-w-[100px] h-[150px] p-5 bg-white/5 border border-white/10 rounded-2xl hover:scale-105 transition-all">
              <p className="text-xs text-gray-300">{hour.time}</p>
              <p className="text-4xl my-3"><AnimatedIcon icon={hour.icon} /></p>
              <p className="text-lg font-bold text-white">{hour.temp}°C</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}