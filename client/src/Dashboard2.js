import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { formatDistanceToNow, subHours, format } from "date-fns";
import Layout from "./components/Layout";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Dashboard2() {
  const navigate = useNavigate();
  const [latestData, setLatestData] = useState(null);
  const [recentData, setRecentData] = useState([]);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [isLive, setIsLive] = useState(false);
  const [countdown, setCountdown] = useState(12);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(
    window.innerWidth >= 1200 && window.innerHeight >= 800
  );
  // Default to 6 hours for chart, 30-min interval
  const [hours, setHours] = useState(6);

  // Check screen size on resize
  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1200 && window.innerHeight >= 800);
      // Exit fullscreen if screen becomes too small
      if (
        isFullscreen &&
        (window.innerWidth < 1200 || window.innerHeight < 800)
      ) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isFullscreen]);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    if (!isLargeScreen) return;
    const root = document.documentElement;
    if (!isFullscreen) {
      if (root.requestFullscreen) root.requestFullscreen();
      else if (root.webkitRequestFullscreen) root.webkitRequestFullscreen();
      else if (root.mozRequestFullScreen) root.mozRequestFullScreen();
      else if (root.msRequestFullscreen) root.msRequestFullscreen();
      setIsFullscreen(true);
    } else {
      // Only attempt to exit if we're actually in fullscreen
      if (
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      ) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Fetch real data from backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch latest sensor data
        const latestResponse = await fetch(
          `${process.env.REACT_APP_API_URL}/api/room2`
        );
        if (!latestResponse.ok) throw new Error("Failed to fetch latest data");

        const latestDataArray = await latestResponse.json();
        const latest = latestDataArray.length > 0 ? latestDataArray[0] : null;

        if (latest) {
          // Check if data is recent (within last 12 seconds)
          const ageInSeconds = (Date.now() - new Date(latest.timestamp)) / 1000;
          if (ageInSeconds <= 12) {
            setLatestData(latest);
            setIsLive(true); // Set to live when we receive recent data
          } else {
            setIsLive(false); // Set to offline when data is stale
          }
        } else {
          setIsLive(false); // Set to offline when no data
        }

        // Update recent data (last 10 entries)
        setRecentData(latestDataArray.slice(0, 10));
        console.log(
          "[Dashboard2] Updated recentData (last 12s):",
          latestDataArray.slice(0, 10)
        );

        // Handle 401/403 on initial fetch
        if (latestResponse.status === 401 || latestResponse.status === 403) {
          console.error("[Dashboard1] 401/403 on initial fetch");
          alert("Session expired or unauthorized. Please log in.");
          navigate("/login");
          return;
        }

        // Fetch historical/chart data
        const token = localStorage.getItem("token");
        let chartLabels = [];
        let tempData = [];
        let humidityData = [];
        if (token && hours > 6) {
          // Authenticated and requesting >6h: fetch from /history
          const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          };
          try {
            const historyResponse = await fetch(
              `${process.env.REACT_APP_API_URL}/api/room2/history?hours=${hours}`,
              { headers }
            );
            if (
              historyResponse.status === 401 ||
              historyResponse.status === 403
            ) {
              console.error("[Dashboard2] 401/403 on /history fetch");
              alert("Session expired or unauthorized. Please log in.");
              navigate("/login");
              return;
            }
            if (!historyResponse.ok)
              throw new Error("Failed to fetch history data");
            const historyData = await historyResponse.json();
            console.log("[Dashboard2] /history data:", historyData);
            chartLabels = historyData.map((d) =>
              format(new Date(d.timestamp), "HH:mm")
            );
            tempData = historyData.map((d) => d.temperature);
            humidityData = historyData.map((d) => d.humidity);
          } catch (err) {
            console.error("[Dashboard2] Error fetching /history:", err);
            alert("Error fetching data. Please log in again.");
            navigate("/login");
            return;
          }
        } else if (hours === 6) {
          // For 6h view, use /recent-history (no auth)
          const recentResponse = await fetch(
            `${process.env.REACT_APP_API_URL}/api/room2/recent-history`
          );
          if (!recentResponse.ok)
            throw new Error("Failed to fetch recent history");
          const recentData = await recentResponse.json();
          chartLabels = recentData.map((d) =>
            format(new Date(d.timestamp), "HH:mm")
          );
          tempData = recentData.map((d) => d.temperature);
          humidityData = recentData.map((d) => d.humidity);
        } else {
          // For <6h, fetch all and filter client-side (if needed)
          const latestResponse = await fetch(
            `${process.env.REACT_APP_API_URL}/api/room2`
          );
          if (latestResponse.status === 401 || latestResponse.status === 403) {
            console.error("[Dashboard2] 401/403 on guest fetch");
            alert("Session expired or unauthorized. Please log in.");
            navigate("/login");
            return;
          }
          if (!latestResponse.ok)
            throw new Error("Failed to fetch latest data");
          const allData = await latestResponse.json();
          console.log("[Dashboard2] /api/room1 guest data:", allData);
          const timeAgo = subHours(new Date(), hours);
          const filtered = allData.filter(
            (d) => new Date(d.timestamp) > timeAgo
          );
          console.log("[Dashboard2] Filtered guest data:", filtered);
          chartLabels = filtered.map((d) =>
            format(new Date(d.timestamp), "HH:mm")
          );
          tempData = filtered.map((d) => d.temperature);
          humidityData = filtered.map((d) => d.humidity);
        }
        setChartData({
          labels: chartLabels,
          datasets: [
            {
              label: "Temperature (°C)",
              data: tempData,
              borderColor: "rgb(239, 68, 68)",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 4,
              fill: true,
              tension: 0.4,
            },
            {
              label: "Humidity (%)",
              data: humidityData,
              borderColor: "rgb(59, 130, 246)",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 4,
              fill: true,
              tension: 0.4,
            },
          ],
        });
        console.log("[Dashboard2] Updated chartData:", {
          labels: chartLabels,
          tempData,
          humidityData,
        });
      } catch (error) {
        console.error("[Dashboard2] Error fetching sensor data:", error);
        setIsLive(false); // Set to offline on error
        console.error("[Dashboard2] Error fetching sensor data:", error);
      }
    };

    console.log("[Dashboard2] Mount: Starting polling every 12 seconds");
    fetchData();
    const interval = setInterval(() => {
      console.log("[Dashboard2] Polling: Fetching data...");
      fetchData();
    }, 12000);
    return () => {
      console.log("[Dashboard2] Unmount: Clearing polling interval");
      clearInterval(interval);
    };
  }, [hours]);

  // Change chart hours with login gating
  function handleHoursChange(h) {
    console.log("handleHoursChange called with h:", h);
    const token = localStorage.getItem("token");
    console.log("token:", token);
    if ((h === 12 || h === 24 || h === 48) && !token) {
      alert("Please log in to view 12h, 24h, or 48h data.");
      navigate("/login");
      setHours(6); // force back to 6h
      return;
    }
    setHours(h);
  }

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 12;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Status color classes
  const getTempStatusClass = (temp) => {
    if (!temp) return "text-gray-500";
    if (temp >= 30 || temp <= 18) return "text-status-critical";
    if (temp >= 28 || temp <= 20) return "text-status-warning";
    return "text-status-good";
  };

  const getHumidityStatusClass = (humidity) => {
    if (!humidity) return "text-gray-500";
    if (humidity >= 80 || humidity <= 20) return "text-status-critical";
    if (humidity >= 70 || humidity <= 30) return "text-status-warning";
    return "text-status-good";
  };

  // Export to CSV
  const handleExportCSV = async () => {
    console.log("handleExportCSV called");
    const token = localStorage.getItem("token");
    console.log("token:", token);
    if (!token) {
      alert("Login required to download CSV");
      navigate("/login");
      return;
    }
    const input = prompt(
      "Enter average interval (e.g., 30m, 1h, 2d)\nMin: 30m, Max: 14d"
    );
    if (!input) return;
    const match = input.match(/^(\d+)(m|h|d)$/);
    if (!match) {
      alert(
        "Invalid format. Use numbers with 'm', 'h', or 'd' (e.g., 30m, 1h)"
      );
      return;
    }
    const [, numStr, unit] = match;
    const num = parseInt(numStr, 10);
    if (
      (unit === "m" && (num < 30 || num > 20160)) ||
      (unit === "h" && (num < 1 || num > 336)) ||
      (unit === "d" && (num < 0.021 || num > 14))
    ) {
      alert("Interval must be between 30 minutes and 14 days");
      return;
    }
    // Convert interval to milliseconds
    const intervalMs =
      unit === "m"
        ? num * 60 * 1000
        : unit === "h"
        ? num * 3600000
        : num * 86400000;
    const buckets = new Map();
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/api/room2/history?hours=${hours}`,
      {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    ).catch((error) => {
      console.log(error, "error fetching data for CSV Export");
      alert("Error fetching data for CSV Export");
      setTimeout(() => {
        navigate("/login");
      }, 1000);
      return;
    });
    if (!response || !response.ok) {
      alert("You are not authorized or your session has expired. Please login again.");
      setTimeout(() => {
        navigate("/login");
      }, 1000);
      return;
    }
    const CSVdata = await response.json();
    for (const entry of CSVdata) {
      const time = new Date(entry.timestamp).getTime();
      const bucketKey = Math.floor(time / intervalMs) * intervalMs;
      if (!buckets.has(bucketKey)) {
        buckets.set(bucketKey, {
          count: 0,
          temperature: 0,
          humidity: 0,
          mq9: { co: 0, ch4: 0, lpg: 0 },
          mq135: { co2: 0, nh3: 0 },
        });
      }
      const bucket = buckets.get(bucketKey);
      bucket.count++;
      bucket.temperature += entry.temperature ?? 0;
      bucket.humidity += entry.humidity ?? 0;
      bucket.mq9.co += entry.mq9?.co ?? 0;
      bucket.mq9.ch4 += entry.mq9?.ch4 ?? 0;
      bucket.mq9.lpg += entry.mq9?.lpg ?? 0;
      bucket.mq135.co2 += entry.mq135?.co2 ?? 0;
      bucket.mq135.nh3 += entry.mq135?.nh3 ?? 0;
    }
    const headers = [
      "Date",
      "Timestamp",
      "Avg Temperature",
      "Avg Humidity",
      "Avg MQ9_CO",
      "Avg MQ9_CH4",
      "Avg MQ9_LPG",
      "Avg MQ135_CO2",
      "Avg MQ135_NH3",
    ];
    const rows = [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([timestamp, b]) => [
        new Date(timestamp).toLocaleString(),
        timestamp,
        (b.temperature / b.count).toFixed(2),
        (b.humidity / b.count).toFixed(2),
        (b.mq9.co / b.count).toFixed(2),
        (b.mq9.ch4 / b.count).toFixed(2),
        (b.mq9.lpg / b.count).toFixed(2),
        (b.mq135.co2 / b.count).toFixed(2),
        (b.mq135.nh3 / b.count).toFixed(2),
      ]);
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sensor_data_avg_${input}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout
      isFullscreen={isFullscreen}
      onToggleFullscreen={isLargeScreen ? toggleFullscreen : null}
    >
      <div className="dashboard-container animate-fadeIn">
        {/* Wide Top Header with title, status, export, fullscreen */}
        <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-4 py-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg border-b border-gray-200 dark:border-gray-700 mb-7">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Room 2 Sensor Dashboard
            </h1>
            {isLive ? (
              <div className="flex items-center mt-2 md:mt-0">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Live
                </span>
                <span className="mx-2 text-gray-400">•</span>
                <span className="text-gray-600 dark:text-gray-300">
                  Next update in {countdown}s
                </span>
              </div>
            ) : (
              <div className="flex items-center mt-2 md:mt-0">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  Offline
                </span>
              </div>
            )}
          </div>
          <div className="flex space-x-3 mt-4 md:mt-0">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center"
              aria-label="Export to CSV"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                ></path>
              </svg>
              Export CSV
            </button>
            {isLargeScreen && (
              <button
                onClick={toggleFullscreen}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 flex items-center"
                aria-label={
                  isFullscreen ? "Exit fullscreen" : "Enter fullscreen"
                }
                disabled={!isLargeScreen}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                  ></path>
                </svg>
                {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              </button>
            )}
          </div>
        </div>

        {/* Sensor Data Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Temperature Card */}
          <div
            className="sensor-item p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl animate-fadeIn"
            style={{ animationDelay: "0.1s" }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <svg
                className="w-5 h-5 text-red-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                ></path>
              </svg>
              Temperature
            </h3>
            <div className="flex items-end justify-between">
              <div>
                <div
                  className={`text-3xl font-bold ${getTempStatusClass(
                    latestData?.temperature
                  )}`}
                >
                  {latestData?.temperature
                    ? latestData.temperature.toFixed(1)
                    : "N/A"}
                  <span className="text-xl">°C</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {latestData?.temperature &&
                    (latestData.temperature >= 30 ||
                    latestData.temperature <= 18 ? (
                      <span className="text-status-critical">Critical</span>
                    ) : latestData.temperature >= 28 ||
                      latestData.temperature <= 20 ? (
                      <span className="text-status-warning">Warning</span>
                    ) : (
                      <span className="text-status-good">Normal</span>
                    ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Min
                </div>
                <div className="font-medium">18°C</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Max
              </div>
              <div className="font-medium">30°C</div>
            </div>
          </div>

          {/* Humidity Card */}
          <div
            className="sensor-item p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl animate-fadeIn"
            style={{ animationDelay: "0.2s" }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <svg
                className="w-5 h-5 text-blue-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z"
                ></path>
              </svg>
              Humidity
            </h3>
            <div className="flex items-end justify-between">
              <div>
                <div
                  className={`text-3xl font-bold ${getHumidityStatusClass(
                    latestData?.humidity
                  )}`}
                >
                  {latestData?.humidity
                    ? latestData.humidity.toFixed(1)
                    : "N/A"}
                  <span className="text-xl">%</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {latestData?.humidity &&
                    (latestData.humidity >= 80 || latestData.humidity <= 20 ? (
                      <span className="text-status-critical">Critical</span>
                    ) : latestData.humidity >= 70 ||
                      latestData.humidity <= 30 ? (
                      <span className="text-status-warning">Warning</span>
                    ) : (
                      <span className="text-status-good">Normal</span>
                    ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Min
                </div>
                <div className="font-medium">20%</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Max
              </div>
              <div className="font-medium">80%</div>
            </div>
          </div>

          {/* Air Quality Card */}
          <div
            className="sensor-item p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl animate-fadeIn"
            style={{ animationDelay: "0.3s" }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <svg
                className="w-5 h-5 text-green-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                ></path>
              </svg>
              Air Quality
            </h3>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {latestData?.mq135?.co2
                    ? Math.round(latestData.mq135.co2)
                    : "N/A"}
                  <span className="text-xl">ppm</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {latestData?.mq135?.co2 &&
                    (latestData.mq135.co2 > 1000 ? (
                      <span className="text-status-critical">Poor</span>
                    ) : latestData.mq135.co2 > 800 ? (
                      <span className="text-status-warning">Fair</span>
                    ) : (
                      <span className="text-status-good">Good</span>
                    ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  CO₂
                </div>
                <div className="font-medium">400-1400</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                NH₃
              </div>
              <div className="font-medium">
                {latestData?.mq135?.nh3
                  ? latestData.mq135.nh3.toFixed(1)
                  : "N/A"}{" "}
                ppm
              </div>
            </div>
          </div>

          {/* Gas Sensors Card */}
          <div
            className="sensor-item p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl animate-fadeIn"
            style={{ animationDelay: "0.4s" }}
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <svg
                className="w-5 h-5 text-red-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
                ></path>
              </svg>
              Gas Sensors
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="sensor-label font-medium text-gray-700 dark:text-gray-300">
                    CO
                  </span>
                  <span className="sensor-value font-bold text-red-600 dark:text-red-400 text-lg">
                    {latestData?.mq9?.co ?? "N/A"} ppm
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-red-500 transition-all duration-500"
                    style={{
                      width: latestData?.mq9?.co
                        ? `${Math.min(100, (latestData.mq9.co / 9) * 100)}%`
                        : "0%",
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="sensor-label font-medium text-gray-700 dark:text-gray-300">
                    CH₄
                  </span>
                  <span className="sensor-value font-bold text-green-600 dark:text-green-400 text-lg">
                    {latestData?.mq9?.ch4 ?? "N/A"} ppm
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-green-500 transition-all duration-500"
                    style={{
                      width: latestData?.mq9?.ch4
                        ? `${Math.min(100, (latestData.mq9.ch4 / 15) * 100)}%`
                        : "0%",
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="sensor-label font-medium text-gray-700 dark:text-gray-300">
                    LPG
                  </span>
                  <span className="sensor-value font-bold text-purple-600 dark:text-purple-400 text-lg">
                    {latestData?.mq9?.lpg ?? "N/A"} ppm
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-purple-500 transition-all duration-500"
                    style={{
                      width: latestData?.mq9?.lpg
                        ? `${Math.min(100, (latestData.mq9.lpg / 500) * 100)}%`
                        : "0%",
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="mb-8 bg-white dark:bg-dashboard-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold mb-2">
                Temperature & Humidity Trends
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Average values over 30-minute intervals for the last {hours}{" "}
                hours
              </p>
            </div>
            <div className="flex space-x-2 mt-2 md:mt-0">
              {[6, 12, 24, 48].map((h) => (
                <button
                  key={h}
                  onClick={() => handleHoursChange(h)}
                  disabled={!localStorage.getItem("token") && h !== 6}
                  className={`px-3 py-1 text-sm rounded-full transition-all duration-300 ${
                    hours === h
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  } ${
                    !localStorage.getItem("token") && h !== 6
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {latestData ? (
            <div
              style={{
                height: isFullscreen ? "300px" : "300px",
                position: "relative",
              }}
            >
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top",
                      labels: {
                        usePointStyle: true,
                        padding: 20,
                      },
                    },
                    tooltip: {
                      mode: "index",
                      intersect: false,
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      titleColor: "white",
                      bodyColor: "white",
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      borderWidth: 1,
                    },
                  },
                  scales: {
                    x: {
                      display: true,
                      title: {
                        display: true,
                        text: "Time (HH:MM)",
                      },
                      grid: {
                        color: "rgba(0, 0, 0, 0.1)",
                      },
                    },
                    y: {
                      display: true,
                      title: {
                        display: true,
                        text: "Value",
                      },
                      grid: {
                        color: "rgba(0, 0, 0, 0.1)",
                      },
                    },
                  },
                  interaction: {
                    mode: "nearest",
                    axis: "x",
                    intersect: false,
                  },
                }}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-2xl font-bold mb-2">No Signal</div>
              <p className="mb-1">Waiting for sensor data...</p>
              <p className="text-sm">
                Looking for data from the last 12 seconds
              </p>
            </div>
          )}
        </div>

        {/* Recent Data Table */}
        <div
          className={`table-container bg-white dark:bg-dashboard-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${
            isFullscreen ? "max-h-60 overflow-y-auto" : ""
          }`}
        >
          <h2 className="text-xl font-bold mb-4">Recent Sensor Readings</h2>
          <div className="table-wrapper overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Temperature
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Humidity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    MQ9 Sensors
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    MQ135 Sensors
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentData
                  .slice(0, isFullscreen ? 5 : undefined)
                  .map((data, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {formatDistanceToNow(new Date(data.timestamp), {
                          addSuffix: true,
                        })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <span className={getTempStatusClass(data.temperature)}>
                          {data.temperature ?? "N/A"} °C
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <span className={getHumidityStatusClass(data.humidity)}>
                          {data.humidity ?? "N/A"} %
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {data.mq9
                          ? `CO: ${data.mq9.co?.toFixed(2) ?? "N/A"} | CH₄: ${
                              data.mq9.ch4?.toFixed(2) ?? "N/A"
                            } | LPG: ${data.mq9.lpg?.toFixed(2) ?? "N/A"}`
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {data.mq135
                          ? `CO₂: ${
                              data.mq135.co2?.toFixed(2) ?? "N/A"
                            } | NH₃: ${data.mq135.nh3?.toFixed(2) ?? "N/A"}`
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard2;
