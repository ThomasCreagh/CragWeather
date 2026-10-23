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

module.exports = { parseDailyPollution };
