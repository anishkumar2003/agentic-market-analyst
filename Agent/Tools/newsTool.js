// agent/tools/newsTool.js

const axios = require("axios");

const axiosInstance = axios.create({
  baseURL: "https://newsapi.org/v2",
  timeout: 5000,
});

// fetch news
async function fetchNews(query) {
  try {
    const res = await axiosInstance.get("/everything", {
      params: {
        q: query,
        language: "en",
        sortBy: "publishedAt",
        pageSize: 5,
        apiKey: process.env.NEWS_API_KEY,
      },
    });

    return res.data.articles || [];
  } catch (err) {
    console.error("News API Error:", err.message);

    return {
      status: "error",
      message: err.message,
    };
  }
}

//  MAIN TOOL
async function getMarketNews() {
  const queries = [
    "Indian stock market",
    "global stock market",
    "US market economy",
  ];

  try {
    const results = await Promise.allSettled(
      queries.map((q) => fetchNews(q))
    );

    const articles = results
      .filter((r) => r.status === "fulfilled")
      .flatMap((r) => r.value)
      .slice(0, 5);

    const parsed = articles.map((a) => ({
      title: a.title,
      source: a.source?.name,
      url: a.url,
      publishedAt: a.publishedAt,
    }));

    return {
      type: "news",
      data: parsed,
    };
  } catch (err) {
    return {
      status: "error",
      message: err.message,
    };
  }
}

module.exports = { getMarketNews };