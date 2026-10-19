"use strict";

const express = require('express');
const apiController = require('./../controllers/apiController.js');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'Crag Weather API working' });
});

router.get('/weather', async (req,res) => {
    try {
        const { lat, lon, city, days } = req.query;
        const day_cnt = Number(days ?? 3);

        let weather;

        if (lat !== undefined && lon !== undefined) {
            weather = await apiController.getXDayWeatherLatLon(
                day_cnt, lat, lon
            );
        } else if (city !== undefined) {
            weather = await apiController.getXDayWeatherCity(
                day_cnt, city
            );
        } else {
            return res.status(400).json({
                error: 'Missing location parameters'
            });
        }

        return res.json(weather);

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: error.message
        });
    }
});

// 404 must be last
router.use((req, res) => {
    res.status(404).send("Oops! Page Not Found");
});

module.exports = router;
