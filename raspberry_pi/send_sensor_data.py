import spidev
import time
import math
import Adafruit_DHT
import requests  # ✅ To send data to your backend

# === Sensor setup ===
spi = spidev.SpiDev()
spi.open(0, 0)
spi.max_speed_hz = 1350000

# === Constants ===
RL = 10.0  # kΩ
RO_MQ135 = 98.6  # Calibrated
RO_MQ9 = 14.8    # Calibrated
DHT_SENSOR = Adafruit_DHT.DHT22
DHT_PIN = 4  # BCM pin

WEBHOOK_URL = "https://room-stat-tracker.onrender.com/api/sensors"

# === Functions ===
def read_adc(channel):
    adc = spi.xfer2([1, (8 + channel) << 4, 0])
    return ((adc[1] & 3) << 8) + adc[2]

def get_voltage(adc_val):
    return adc_val * 5.0 / 1023.0

def get_rs(voltage):
    if voltage == 0:
        return float('inf')
    return (5.0 - voltage) * RL / voltage

def get_ppm(rs_ro, m, b):
    return round(10 ** (m * math.log10(rs_ro) + b), 2)

# === Main Loop ===
print("📊 Reading DHT22 + MQ9 + MQ135 and sending every 5s...\n")

while True:
    try:
        # === Temp & Humidity ===
        humidity, temperature = Adafruit_DHT.read_retry(DHT_SENSOR, DHT_PIN)
        if humidity is None or temperature is None:
            print("⚠️ Failed to read from DHT22 sensor. Retrying...")
            continue

        temperature = round(temperature, 1)
        humidity = round(humidity, 1)

        # === MQ ADC reads ===
        mq135_adc = read_adc(0)
        mq9_adc = read_adc(1)

        mq135_voltage = get_voltage(mq135_adc)
        mq9_voltage = get_voltage(mq9_adc)

        rs_mq135 = get_rs(mq135_voltage)
        rs_mq9 = get_rs(mq9_voltage)

        ratio_mq135 = rs_mq135 / RO_MQ135
        ratio_mq9 = rs_mq9 / RO_MQ9

        # === Gas Concentrations ===
        co2 = get_ppm(ratio_mq135, -1.5, 3.46)
        nh3 = round(co2 * 0.02, 2)

        co = get_ppm(ratio_mq9, -0.72, 0.34)
        ch4 = get_ppm(ratio_mq9, -0.38, 0.48)
        lpg = get_ppm(ratio_mq9, -0.47, 0.38)

        # === Payload ===
        payload = {
            "temperature": temperature,
            "humidity": humidity,
            "mq9": {
                "co": co,
                "ch4": ch4,
                "lpg": lpg
            },
            "mq135": {
                "co2": co2,
                "nh3": nh3
            }
        }

        # === Print to Console ===
        print("🧾 Payload to send:")
        print(payload)
        print("=" * 60)
        print(f"MQ135: Rs = {rs_mq135:.2f} kohm, Rs/Ro = {ratio_mq135:.2f}")
        print(f"MQ9:   Rs = {rs_mq9:.2f} kohm, Rs/Ro = {ratio_mq9:.2f}")
        print("=" * 60)

        # === Send to Web ===
        response = requests.post(WEBHOOK_URL, json=payload, timeout=5)

        if response.status_code == 201:
            print("✅ Data sent successfully.\n")
        else:
            print(f"❌ Failed to send. Status code: {response.status_code}, Response: {response.text}\n")

        time.sleep(5)

    except KeyboardInterrupt:
        print("\n🛑 Stopped by user")
        break

    except Exception as e:
        print(f"❌ Error during reading or sending: {e}")
        time.sleep(5)
