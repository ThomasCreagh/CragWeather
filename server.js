"use strict";

const PORT = process.env.PORT || 3000;

const express = require('express')
const app = express();

const v1Router = require('./server/routes/api.js');
//const v1Router = express.Router();

app.use(express.json());
app.use(express.static('public'));
app.use('/api/v1', v1Router);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
