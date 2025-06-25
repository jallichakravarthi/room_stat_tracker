import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, subHours, isAfter } from "date-fns";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const [sensorData, setSensorData] = useState([]);
  const [latestData, setLatestData] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [hours, setHours] = useState(10);
  const [hasAlerted, setHasAlerted] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev === 1 ? 5 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!latestData || !isLive) {
      setHasAlerted(false); // Reset alert state if not live
      return;
    }

    const isMissing = (value) => value === undefined || value === null;

    const temperature = latestData.temperature;
    const humidity = latestData.humidity;
    const mq9 = latestData.mq9;
    const mq135 = latestData.mq135;

    // Threshold breaches
    const thresholdBreached =
      (!isMissing(temperature) && temperature > 37) ||
      (!isMissing(humidity) && humidity > 75) ||
      (mq9 &&
        ((!isMissing(mq9.co) && mq9.co > 10) ||
          (!isMissing(mq9.ch4) && mq9.ch4 > 5) ||
          (!isMissing(mq9.lpg) && mq9.lpg > 5))) ||
      (mq135 &&
        ((!isMissing(mq135.co2) && mq135.co2 > 1000) ||
          (!isMissing(mq135.nh3) && mq135.nh3 > 10)));

    // Sensor missing conditions
    const missingSensors =
      isMissing(temperature) ||
      isMissing(humidity) ||
      !mq9 ||
      isMissing(mq9?.co) ||
      isMissing(mq9?.ch4) ||
      isMissing(mq9?.lpg) ||
      !mq135 ||
      isMissing(mq135?.co2) ||
      isMissing(mq135?.nh3);

    const alertNeeded = thresholdBreached || missingSensors;

    if (alertNeeded && !hasAlerted) {
      fetch(`${process.env.REACT_APP_API_URL}/api/alerts/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          subject: "🚨 Sensor Alert: Room Tracker",
          temperature,
          humidity,
          mq9: mq9 || {},
          mq135: mq135 || {},
          missingSensors,
          timestamp: latestData.timestamp,
        }),
      })
        .then((res) => res.json())
        .then((res) => {
          console.log("✅ Alert email triggered:", res);
          setHasAlerted(true);
        })
        .catch((err) => {
          console.error("❌ Error sending alert email:", err);
        });
    }
  }, [latestData, isLive]);

  useEffect(() => {
    const fetchData = () => {
      fetch(`${process.env.REACT_APP_API_URL}/api/sensors`) // This will need to be changed if you want to respect hour range server-side
        .then((res) => res.json())
        .then((data) => {
          const timeAgo = subHours(new Date(), hours);
          const filtered = data.filter((d) =>
            isAfter(new Date(d.timestamp), timeAgo)
          );
          setSensorData(filtered);

          if (filtered.length > 0) {
            const latest = filtered[0];
            const ageInSeconds =
              (Date.now() - new Date(latest.timestamp)) / 1000;
            setLatestData(latest);
            setIsLive(ageInSeconds <= 12);
          } else {
            setLatestData(null);
            setIsLive(false);
          }
        })
        .catch((err) => {
          console.error("Fetch error:", err);
          setIsLive(false);
          setLatestData(null);
        });
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [hours]);

  const handleExportCSV = () => {
    if (!token) {
      alert("Login required to download CSV");
      navigate("/login");
      return;
    }

    const headers = [
      "Timestamp",
      "Temperature",
      "Humidity",
      "MQ9_CO",
      "MQ9_CH4",
      "MQ9_LPG",
      "MQ135_CO2",
      "MQ135_NH3",
    ];
    const rows = sensorData.map((d) => [
      new Date(d.timestamp).toLocaleString(),
      d.temperature ?? "N/A",
      d.humidity ?? "N/A",
      d.mq9?.co ?? "N/A",
      d.mq9?.ch4 ?? "N/A",
      d.mq9?.lpg ?? "N/A",
      d.mq135?.co2 ?? "N/A",
      d.mq135?.nh3 ?? "N/A",
    ]);
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sensor_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleHourChange = (e) => {
    const val = parseInt(e.target.value);
    if (val > 10 && !token) {
      alert("Login required to view data beyond 10 hours");
      navigate("/login");
    } else {
      setHours(val);
    }
  };

  const latestTempWarning = latestData?.temperature > 35;

  const bucketedData = {};
  sensorData.forEach((entry) => {
    const date = new Date(entry.timestamp);
    const key = `${date.getHours()}:${Math.floor(date.getMinutes() / 10) * 10}`;
    if (!bucketedData[key]) {
      bucketedData[key] = { tempSum: 0, humSum: 0, count: 0 };
    }
    bucketedData[key].tempSum += entry.temperature ?? 0;
    bucketedData[key].humSum += entry.humidity ?? 0;
    bucketedData[key].count += 1;
  });

  const bucketLabels = Object.keys(bucketedData);
  const avgTemps = bucketLabels.map((k) =>
    (bucketedData[k].tempSum / bucketedData[k].count).toFixed(2)
  );
  const avgHums = bucketLabels.map((k) =>
    (bucketedData[k].humSum / bucketedData[k].count).toFixed(2)
  );

  const chartData = {
    labels: bucketLabels,
    datasets: [
      {
        label: "Avg Temp (°C)",
        data: avgTemps,
        borderColor: "rgba(255,99,132,1)",
        backgroundColor: "rgba(255,99,132,0.2)",
        tension: 0.3,
      },
      {
        label: "Avg Humidity (%)",
        data: avgHums,
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        tension: 0.3,
      },
    ],
  };

  const recentData = sensorData.slice(0, 10).reverse();

  return (
    <div className="App">
      <header className="header">
        <h1>Room Sensor Dashboard</h1>
        <div className="auth-actions">
          <button onClick={handleExportCSV} className="csv-btn">
            Export to CSV
          </button>
          {!token && (
            <button onClick={() => navigate("/login")} className="login-btn">
              Login
            </button>
          )}
        </div>
      </header>

      <div className="time-range">
        <label htmlFor="hours">View last </label>
        <input
          id="hours"
          type="number"
          min="1"
          max="336"
          value={hours}
          onChange={handleHourChange}
        />
        <span> hours</span>
      </div>

      {isLive && latestData ? (
        <div className="live-data">
          <h4 style={{ justifyContent: "flex-end" }}>
            🟢 Live Data (Updated{" "}
            {formatDistanceToNow(new Date(latestData.timestamp), {
              addSuffix: true,
            })}
            )
          </h4>
          <p style={{fontSize: '0.8rem', fontFamily: "'Courier New', monospace", justifyContent:"flex-end"}}>Refreshing in {countdown}s</p>
          {latestTempWarning && (
            <p style={{ color: "red" }}>Temperature is too high!</p>
          )}
          <ul>
            <li>
              <strong>Temperature:</strong>{" "}
              {latestData.temperature ?? "Sensor not reporting"} °C
            </li>
            <li>
              <strong>Humidity:</strong>{" "}
              {latestData.humidity ?? "Sensor not reporting"} %
            </li>
            <li>
              <strong>MQ9:</strong>{" "}
              {latestData.mq9
                ? `${latestData.mq9.co ?? "N/A"} CO / ${
                    latestData.mq9.ch4 ?? "N/A"
                  } CH₄ / ${latestData.mq9.lpg ?? "N/A"} LPG`
                : "Sensor not reporting"}
            </li>
            <li>
              <strong>MQ135:</strong>{" "}
              {latestData.mq135
                ? `${latestData.mq135.co2 ?? "N/A"} CO₂ / ${
                    latestData.mq135.nh3 ?? "N/A"
                  } NH₃`
                : "Sensor not reporting"}
            </li>
          </ul>
        </div>
      ) : (
        <div className="no-data">
          <h4 style={{ justifyContent: "flex-end" }}>🔴 No Live Data</h4>
          <p>Waiting for recent sensor data (last 12 seconds)...</p>
        </div>
      )}

      <hr />

      <h2>📊 Avg Temp & Humidity (Last {hours} Hours / 10-min intervals)</h2>
      <Line data={chartData} />

      <hr />

      <h2>Last 10 Sensor Readings</h2>
      <div className="table-wrapper">
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Temp (°C)</th>
              <th>Humidity (%)</th>
              <th>MQ9 (CO / CH4 / LPG)</th>
              <th>MQ135 (CO2 / NH3)</th>
            </tr>
          </thead>
          <tbody>
            {recentData.map((data, index) => (
              <tr key={index}>
                <td>
                  {formatDistanceToNow(new Date(data.timestamp), {
                    addSuffix: true,
                  })}
                </td>
                <td>{data.temperature ?? "N/A"}</td>
                <td>{data.humidity ?? "N/A"}</td>
                <td>
                  {data.mq9
                    ? `${data.mq9.co ?? "N/A"} / ${data.mq9.ch4 ?? "N/A"} / ${
                        data.mq9.lpg ?? "N/A"
                      }`
                    : "N/A"}
                </td>
                <td>
                  {data.mq135
                    ? `${data.mq135.co2 ?? "N/A"} / ${data.mq135.nh3 ?? "N/A"}`
                    : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
