// agent/tools/marketTool.js

const axios = require("axios");

const axiosInstance = axios.create({
  baseURL: "https://apidojo-yahoo-finance-v1.p.rapidapi.com",
  headers: {
    "X-RapidAPI-Key": process.env.RAPID_API_KEY,
    "X-RapidAPI-Host": "apidojo-yahoo-finance-v1.p.rapidapi.com",
  },
  timeout: 5000,
});

function getTimestamps() {
  const now = Math.floor(Date.now() / 1000);
  const oneDayAgo = now - 86400;

  return {
    period1: oneDayAgo,
    period2: now,
  };
}

async function fetchTimeSeries(symbol) {
  try {
    const { period1, period2 } = getTimestamps();

    const res = await axiosInstance.get("/stock/v2/get-timeseries", {
      params: {
        symbol,
        region: "US",
        period1,
        period2,
      },
    });

    const result = res.data?.timeseries?.result?.[0];

    if (!result) {
      return { symbol, status: "error", message: "No data" };
    }

    const closeData = result.indicators?.quote?.[0]?.close || [];

    const latest = closeData[closeData.length - 1];
    const prev = closeData[closeData.length - 2];

    const change = prev ? ((latest - prev) / prev) * 100 : 0;

    return {
      symbol,
      price: latest,
      change,
      status: "success",
    };
  } catch (err) {
    return {
      symbol,
      status: "error",
      message: err.message,
    };
  }
}


async function getGlobalMarketData() {
  const symbols = ["^DJI", "^IXIC", "^GSPC"];

  const results = await Promise.allSettled(
    symbols.map((s) => fetchTimeSeries(s))
  );

  return {
    type: "global",
    data: results.map((r) =>
      r.status === "fulfilled" ? r.value : { status: "error" }
    ),
  };
}

module.exports = { getGlobalMarketData };