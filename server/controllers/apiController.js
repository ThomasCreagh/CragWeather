require('dotenv').config();

const API_KEY = process.env.API_KEY || undefined;

const { parseWeather } = require("../services/weatherParser");

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
    const error = new Error(
      weatherResponse.status === 404
        ? "Location not found"
        : "Weather API error"
    );

    error.status = weatherResponse.status === 404 ? 404 : 502;
    throw error;
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

module.exports = { getXDayWeatherLatLon, getXDayWeatherCity };
