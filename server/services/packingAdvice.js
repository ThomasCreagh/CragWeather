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

module.exports = { getPackingAdvice };
