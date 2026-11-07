import express from 'express';
import { getDb } from '../db/connection.js';

const router = express.Router();

// WMO Weather code interpreter
function getWeatherDescription(code) {
  if (code === 0) return { label: 'Clear Sky', icon: 'Sun' };
  if (code <= 3) return { label: 'Partly Cloudy', icon: 'CloudSun' };
  if (code <= 48) return { label: 'Foggy / Overcast', icon: 'Cloud' };
  if (code <= 55) return { label: 'Drizzle', icon: 'CloudDrizzle' };
  if (code <= 65) return { label: 'Rain', icon: 'CloudRain' };
  if (code <= 75) return { label: 'Snow / Flurries', icon: 'Snowflake' };
  if (code <= 82) return { label: 'Heavy Showers', icon: 'CloudRain' };
  if (code >= 95) return { label: 'Thunderstorm', icon: 'CloudLightning' };
  return { label: 'Scattered Clouds', icon: 'Cloud' };
}

// GET /api/weather?farm_id=1
router.get('/', async (req, res) => {
  try {
    const { farm_id } = req.query;
    const db = await getDb();

    // Fetch farm location
    const farm = db.prepare('SELECT * FROM farms WHERE id = ?').get(farm_id || 1) ||
                 db.prepare('SELECT * FROM farms LIMIT 1').get();

    if (!farm) {
      return res.status(404).json({ error: 'Farm not found' });
    }

    const lat = farm.latitude;
    const lon = farm.longitude;

    let weatherData = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=auto`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      if (response.ok) {
        weatherData = await response.json();
      }
    } catch (fetchErr) {
      console.warn('[Weather API] Open-Meteo fetch error or timeout, utilizing simulated local forecast:', fetchErr.message);
    }

    // If external call failed or timed out, generate a deterministic fallback 7-day forecast
    const dailyForecast = [];
    const today = new Date();

    if (weatherData && weatherData.daily && weatherData.daily.time) {
      for (let i = 0; i < weatherData.daily.time.length; i++) {
        const dateStr = weatherData.daily.time[i];
        const code = weatherData.daily.weathercode[i];
        const maxTemp = weatherData.daily.temperature_2m_max[i];
        const minTemp = weatherData.daily.temperature_2m_min[i];
        const precip = weatherData.daily.precipitation_sum[i];
        const wind = weatherData.daily.windspeed_10m_max[i];

        dailyForecast.push({
          date: dateStr,
          temp_max: maxTemp,
          temp_min: minTemp,
          precipitation_mm: precip,
          windspeed_kmh: wind,
          weather_code: code,
          ...getWeatherDescription(code)
        });
      }
    } else {
      // Offline fallback
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const isRainy = i === 2;
        dailyForecast.push({
          date: dateStr,
          temp_max: isRainy ? 28.5 : 33.0 + (i % 3),
          temp_min: 21.0 + (i % 2),
          precipitation_mm: isRainy ? 18.5 : (i === 1 ? 4.2 : 0.0),
          windspeed_kmh: 14.5,
          weather_code: isRainy ? 80 : 1,
          ...getWeatherDescription(isRainy ? 80 : 1)
        });
      }
    }

    // Now cross-reference forecast dates against active/planned crop cycle milestones (+/- 3 days)
    const cycles = db.prepare(`
      SELECT 
        c.id as cycle_id,
        p.plot_code,
        p.name as plot_name,
        cr.name as crop_name,
        cv.name as variety_name,
        c.sowing_date,
        c.expected_harvest_date,
        c.status
      FROM crop_cycles c
      JOIN plots p ON c.plot_id = p.id
      JOIN crop_varieties cv ON c.crop_variety_id = cv.id
      JOIN crops cr ON cv.crop_id = cr.id
      WHERE p.farm_id = ? AND c.status IN ('Planned', 'Sown', 'Growing')
    `).all(farm.id);

    const warnings = [];

    dailyForecast.forEach(day => {
      const forecastTime = new Date(day.date).getTime();

      cycles.forEach(cycle => {
        // Check sowing date proximity
        if (cycle.sowing_date) {
          const sowingTime = new Date(cycle.sowing_date).getTime();
          const diffDays = Math.abs(Math.round((forecastTime - sowingTime) / (1000 * 60 * 60 * 24)));
          
          if (diffDays <= 3) {
            if (day.precipitation_mm >= 15.0) {
              warnings.push({
                type: 'HEAVY_RAIN',
                severity: 'critical',
                date: day.date,
                cycle_id: cycle.cycle_id,
                title: `Heavy Rain Alert during Sowing Window: ${cycle.crop_name} (${cycle.plot_code})`,
                message: `Forecast predicts ${day.precipitation_mm}mm precipitation on ${day.date}. Waterlogging risks poor seedling emergence on plot "${cycle.plot_name}". Postpone sowing or ensure furrow drainage.`,
                plot: cycle.plot_name,
                milestone: 'Sowing'
              });
            }
            if (day.temp_max >= 35.0) {
              warnings.push({
                type: 'HEAT_STRESS',
                severity: 'warning',
                date: day.date,
                cycle_id: cycle.cycle_id,
                title: `Extreme Heat Alert at Sowing: ${cycle.crop_name} (${cycle.plot_code})`,
                message: `Max temperature of ${day.temp_max}°C forecasted on ${day.date}. Pre-irrigate seedbed to prevent soil crusting and desiccation.`,
                plot: cycle.plot_name,
                milestone: 'Sowing'
              });
            }
          }
        }

        // Check harvest date proximity
        if (cycle.expected_harvest_date) {
          const harvestTime = new Date(cycle.expected_harvest_date).getTime();
          const diffDays = Math.abs(Math.round((forecastTime - harvestTime) / (1000 * 60 * 60 * 24)));

          if (diffDays <= 3) {
            if (day.precipitation_mm >= 10.0) {
              warnings.push({
                type: 'RAIN_AT_HARVEST',
                severity: 'critical',
                date: day.date,
                cycle_id: cycle.cycle_id,
                title: `Rain Risk at Harvest: ${cycle.crop_name} (${cycle.plot_code})`,
                message: `${day.precipitation_mm}mm rain expected on ${day.date} near harvest date (${cycle.expected_harvest_date}). Accelerate harvest or prepare moisture tarps to prevent grain mold.`,
                plot: cycle.plot_name,
                milestone: 'Harvest'
              });
            }
          }
        }
      });
    });

    res.json({
      farm: {
        id: farm.id,
        name: farm.name,
        location: farm.location,
        latitude: farm.latitude,
        longitude: farm.longitude
      },
      forecast: dailyForecast,
      warnings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

