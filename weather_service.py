import requests
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Map WMO weather codes to human-readable text and clean categories for UI styling
# Categories: "sunny", "cloudy", "rainy", "snowy", "stormy"
WMO_CODE_MAP = {
    0: ("Clear Sky", "sunny"),
    1: ("Mainly Clear", "sunny"),
    2: ("Partly Cloudy", "cloudy"),
    3: ("Overcast", "cloudy"),
    45: ("Foggy", "cloudy"),
    48: ("Depositing Rime Fog", "cloudy"),
    51: ("Light Drizzle", "rainy"),
    53: ("Moderate Drizzle", "rainy"),
    55: ("Dense Drizzle", "rainy"),
    56: ("Light Freezing Drizzle", "rainy"),
    57: ("Dense Freezing Drizzle", "rainy"),
    61: ("Slight Rain", "rainy"),
    63: ("Moderate Rain", "rainy"),
    65: ("Heavy Rain", "rainy"),
    66: ("Light Freezing Rain", "rainy"),
    67: ("Heavy Freezing Rain", "rainy"),
    71: ("Slight Snow Fall", "snowy"),
    73: ("Moderate Snow Fall", "snowy"),
    75: ("Heavy Snow Fall", "snowy"),
    77: ("Snow Grains", "snowy"),
    80: ("Slight Rain Showers", "rainy"),
    81: ("Moderate Rain Showers", "rainy"),
    82: ("Violent Rain Showers", "rainy"),
    85: ("Slight Snow Showers", "snowy"),
    86: ("Heavy Snow Showers", "snowy"),
    95: ("Thunderstorm", "stormy"),
    96: ("Thunderstorm with Slight Hail", "stormy"),
    99: ("Thunderstorm with Heavy Hail", "stormy"),
}

def get_weather(city_name: str) -> dict:
    """
    Fetches real-time weather information for a given city name using Open-Meteo Geocoding & Forecast APIs.
    No API key required.
    """
    if not city_name or not isinstance(city_name, str):
        return {"error": "Invalid city name provided."}

    city_name = city_name.strip()
    logger.info(f"Fetching weather for: {city_name}")

    try:
        # 1. Geocode City Name
        geocode_url = f"https://geocoding-api.open-meteo.com/v1/search?name={city_name}&count=1&language=en&format=json"
        geo_response = requests.get(geocode_url, timeout=5)
        geo_response.raise_for_status()
        
        geo_data = geo_response.json()
        if not geo_data.get("results"):
            logger.warning(f"No geocoding results found for: {city_name}")
            return {"error": f"Could not find the city '{city_name}'."}

        location = geo_data["results"][0]
        lat = location["latitude"]
        lon = location["longitude"]
        display_name = f"{location['name']}, {location.get('admin1', '')} {location.get('country', '')}".replace("  ", " ").strip(", ")

        # 2. Fetch Weather Data
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&hourly=relativehumidity_2m"
        weather_response = requests.get(weather_url, timeout=5)
        weather_response.raise_for_status()

        weather_data = weather_response.json()
        current = weather_data.get("current_weather")
        if not current:
            logger.error("No current weather data in API response")
            return {"error": "Failed to parse weather information."}

        # 3. Parse Weather Code & Humidity
        wmo_code = current.get("weathercode", 0)
        desc, theme = WMO_CODE_MAP.get(wmo_code, ("Unknown", "cloudy"))
        
        # Get humidity (we can search hourly for the current hour index)
        humidity = 50 # Fallback
        hourly_times = weather_data.get("hourly", {}).get("time", [])
        hourly_humidity = weather_data.get("hourly", {}).get("relativehumidity_2m", [])
        
        current_time_str = current.get("time")
        if current_time_str in hourly_times:
            idx = hourly_times.index(current_time_str)
            humidity = hourly_humidity[idx]

        return {
            "success": True,
            "city": display_name,
            "query": city_name,
            "temp": current.get("temperature"),
            "wind_speed": current.get("windspeed"),
            "weather_desc": desc,
            "theme": theme,
            "humidity": humidity,
            "latitude": lat,
            "longitude": lon
        }

    except requests.exceptions.RequestException as e:
        logger.error(f"Network error while fetching weather data: {e}")
        return {"error": "Weather service is currently unavailable. Please check your internet connection."}
    except Exception as e:
        logger.error(f"Unexpected error in weather service: {e}")
        return {"error": "An unexpected error occurred while fetching weather."}

# Quick test routine if run directly
if __name__ == "__main__":
    result = get_weather("London")
    print(result)
