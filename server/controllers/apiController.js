require('dotenv').config();

const API_KEY = process.env.API_KEY || undefined;

const goodLimits = {
  co: 4000,
  no2: 25,
  o3: 100,
  so2: 40,
  pm2_5: 15,
  pm10: 45
};

const healthRisks = {
  co: "Headaches, dizziness, nausea, fatigue, reduced oxygen delivery to organs. Severe exposure can cause unconsciousness or death.",
  no2: "Airway inflammation, coughing, wheezing, shortness of breath, worsened asthma, increased respiratory infections.",
  o3: "Chest pain, throat irritation, coughing, reduced lung function, worsened asthma and other respiratory diseases.",
  so2: "Breathing difficulties, throat irritation, bronchospasm, asthma attacks, especially in sensitive individuals.",
  pm2_5: "Lung inflammation, worsened asthma, increased risk of heart attacks, strokes, cardiovascular disease and premature death with prolonged exposure.",
  pm10: "Eye and throat irritation, coughing, aggravated asthma and bronchitis, reduced lung function and increased respiratory problems."
};

async function getXDayWeatherLatLon(days, lat, lon) {
  if (days > 15) { days = 15; }
  return getXDayWeather(`http://api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&cnt=${Number(days) + 1}&units=metric&appid=${API_KEY}`);
};

async function getXDayWeatherCity(days, city) {
  if (days > 15) { days = 15; }
  return getXDayWeather(`http://api.openweathermap.org/data/2.5/forecast/daily?q=${city}&cnt=${Number(days) + 1}&units=metric&appid=${API_KEY}`);
}

async function getXDayWeather(fetchStr) {
  const weatherResponse = await fetch(fetchStr);

  if (!weatherResponse.ok) {
    const errorData = await weatherResponse.text();

    console.error("OpenWeather error:", errorData);
    console.error("fetchStr:", fetchStr);

    throw new Error(`Weather API error: ${weatherResponse.status}`);
  }

  const weatherData = await weatherResponse.json();

  const { lat, lon } = weatherData.city.coord;

  const airResponse = await fetch(
    `https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`
  );

  if (!airResponse.ok) {
    throw new Error(`Air API error: ${airResponse.status}`);
  }

  const airData = await airResponse.json();

  return parseWeather(weatherData, airData);
}

// logic for advice
function getPackingAdvice(days) {
  const next3Days = days.slice(0, 3);

  const umbrella = next3Days.some(day =>
    day.rainProbability > 0 || day.rainfall > 0
  );

  const avgTemp = next3Days.reduce(
    (sum, day) => sum + day.temperature.day, 0
  ) / next3Days.length;

  const clothing =
    avgTemp < 8 ? "Cold" :
    avgTemp > 24 ? "Hot" :
    "Mild";

  return { umbrella, clothing };
}

// air pollution parsing
function parseDailyPollution(entries, timezone) {
  const groups = {};

  for (const entry of entries) {
    const date = new Date((entry.dt + timezone) * 1000)
      .toISOString().split("T")[0];

    (groups[date] ??= []).push(entry);
  }

  const result = {};

  for (const [date, hours] of Object.entries(groups)) {
    const average = {};
    const max = {};

    for (const pollutant of Object.keys(goodLimits)) {
      const values = hours.map(h => h.components[pollutant]);

      average[pollutant] = Number(
        (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)
      );

      max[pollutant] = Math.max(...values);
    }

    result[date] = {
      average,
      max,
      warnings: checkPollution({ components: max }),
      hoursRecorded: hours.length
    };
  }

  return result;
}

function checkPollution(entry) {
  return Object.entries(goodLimits)
    .filter(([pollutant, limit]) =>
      entry.components[pollutant] >= limit
    )
    .map(([pollutant, limit]) => ({
      pollutant,
      value: entry.components[pollutant],
      goodLimit: limit,
      exceededBy: Number(
        (entry.components[pollutant] - limit).toFixed(2)
      ),
      healthRisks: healthRisks[pollutant]
    }));
}

// weather parsing
function parseWeather(data, airData) {
  const timezone = data.city.timezone;
  const pollution = parseDailyPollution(airData.list, timezone);

  const days = data.list.map(day => {
    const date = new Date((day.dt + timezone) * 1000)
      .toISOString().split("T")[0];

    return {
      ...parseDay(day),
      date,
      pollution: pollution[date] ?? null
    };
  });

  return {
    city: data.city.name,
    country: data.city.country,
    coordinates: data.city.coord,
    timezone,
    packing: getPackingAdvice(days),
    days
  };
}

function parseDay(day) {
  return {
    date: new Date(day.dt * 1000).toISOString().split("T")[0],
    sunrise: new Date(day.sunrise * 1000),
    sunset: new Date(day.sunset * 1000),

    temperature: {
      day: day.temp.day,
      min: day.temp.min,
      max: day.temp.max,
      night: day.temp.night,
      evening: day.temp.eve,
      morning: day.temp.morn
    },

    feelsLike: day.feels_like.day,
    humidity: day.humidity,
    pressure: day.pressure,

    weather: day.weather[0]?.main,
    description: day.weather[0]?.description,
    icon: day.weather[0]?.icon,

    windSpeed: day.speed,
    windDirection: day.deg,
    windGust: day.gust,

    clouds: day.clouds,
    rainProbability: day.pop,
    rainfall: day.rain ?? 0
  };
}

module.exports = {
  getXDayWeatherLatLon,
  getXDayWeatherCity
};
