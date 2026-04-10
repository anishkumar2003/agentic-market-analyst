// scheduler.js

const cron = require("node-cron");
const { runAgent } = require("./Agent/agent");

runAgent();

// cron.schedule("0 21 * * *", () => {
//   console.log("Running agent at 9 PM...");
//   runAgent();
// });