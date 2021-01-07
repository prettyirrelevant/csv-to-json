const express = require("express");
const axios = require("axios");
const { v4: uuid4 } = require("uuid");
const { parse } = require("fast-csv");
const pino = require("pino");
const expressPino = require("express-pino-logger");
const logger = pino({ level: process.env.LOG_LEVEL || "info" });
const expressLogger = expressPino({ logger });
const app = express();
const { RateLimiterMemory } = require("rate-limiter-flexible");
const rateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 1,
  blockDuration: 300,
});
const PORT = process.env.PORT || 3000;

// rate limiting to 10 requests per second
app.use((req, res, next) => {
  rateLimiter
    .consume(req.socket.remoteAddress)
    .then(() => {
      next();
    })
    .catch((err) => {
      res.status(429).send({ status: "error", message: "Too many requests" });
    });
});

//CORS config
app.use(require("cors")());

//logging
app.use(expressLogger);

// parse request body
app.use(express.json());

//filter function to display just elements in `select_field`
const selected = (obj, keys) => keys.reduce((a, b) => ((a[b] = obj[b]), a), {});

app.post("/convert", async (req, res) => {
  const reqData = req.body;
  let responseData = [];

  //check if body contains "csv"
  if (!reqData.csv) {
    res.status(400).send({
      status: "error",
      message: "Payload missing required field `csv`",
    });
  }

  //check if url of csv is present
  if (!reqData.csv.url) {
    res.status(400).send({
      status: "error",
      message: "Payload missing required field `csv['url']`",
    });
  }

  //destructuring
  const {
    csv: { url, select_fields, length },
  } = reqData;

  //checks if url contains valid csv file
  if (url.split("/").pop().split(".").pop() !== "csv") {
    res.status(400).send({ status: "error", message: "URL is not valid" });
  }

  const csvRequest = await axios.get(url);
  const stream = parse({
    headers: true,
    ignoreEmpty: true,
    trim: true,
    maxRows: length ? length : 0,
  })
    .on("error", () => {
      res
        .status(500)
        .send({ status: "error", message: "Unable to parse csv file" });
    })
    .on("data", (row) => {
      if (!select_fields) {
        responseData.push(row);
      } else {
        responseData.push(selected(row, select_fields));
      }
    })
    .on("end", (rowsCount) => {
      logger.info(`Converted ${rowsCount} rows to JSON`);
      res.status(200).send({
        conversion_key: uuid4(),
        status: "success",
        json: responseData,
        timestamp: new Date(),
      });
    });

  stream.write(csvRequest.data);
  stream.end();
});

app.listen(PORT, () => {
  logger.info(`Application running on ${PORT}`);
});
