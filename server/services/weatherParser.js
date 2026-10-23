const { parseDailyPollution } = require("./pollutionParser");
const { getPackingAdvice } = require("./packingAdvice");

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

module.exports = { parseWeather };
