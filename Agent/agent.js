// agent/agent.js

require("dotenv").config();
const OpenAI = require("openai");

const {
  getGlobalMarketData,
  getIndianMarketData,
} = require("./Tools/marketTool");

const { getMarketNews } = require("./Tools/newsTool");
const { sendEmail } = require("./Tools/emailTool");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Tool registry
const tools = {
  getGlobalMarketData,
  getIndianMarketData,
  getMarketNews,
  sendEmail,
};

// System prompt (STRICT)
const systemPrompt = `
You are an autonomous financial analysis agent.

You MUST ONLY use these tools:
- getGlobalMarketData
- getIndianMarketData
- getMarketNews
- sendEmail

Workflow:
1. Fetch global market data
2. Fetch Indian market data
3. Fetch news if needed
4. Analyze all data
5. Generate report
6. Send email

Rules:
- Do NOT invent tool names
- If any tool fails, continue with available data
- Keep report concise
- always send email either its faliure or success
`;
// MAIN AGENT
async function runAgent() {
  let messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: "Generate today's market report" },
  ];

  let maxSteps = 6; // prevent infinite loops

  while (maxSteps-- > 0) {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools: [
        {
          type: "function",
          function: {
            name: "getGlobalMarketData",
            parameters: { type: "object", properties: {} },
          },
        },
        {
          type: "function",
          function: {
            name: "getIndianMarketData",
            parameters: { type: "object", properties: {} },
          },
        },
        {
          type: "function",
          function: {
            name: "getMarketNews",
            parameters: { type: "object", properties: {} },
          },
        },
        {
          type: "function",
          function: {
            name: "sendEmail",
            parameters: {
              type: "object",
              properties: {
                report: { type: "string" },
              },
              required: ["report"],
            },
          },
        },
      ],
    });

    const msg = response.choices[0].message;

    // STEP 1: Always push assistant message first
    messages.push(msg);

    // STEP 2: If no tool call → done
    if (!msg.tool_calls) {
      console.log("Final Output:\n", msg.content);
      break;
    }

    // STEP 3: Execute tool calls
    for (const toolCall of msg.tool_calls) {
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments || "{}");

      console.log("🔧 Calling tool:", functionName);

      // Safety check
      if (!tools[functionName]) {
        console.error("❌ Invalid tool:", functionName);

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            error: `Tool ${functionName} not found`,
          }),
        });

        continue;
      }

      try {
        const result = await tools[functionName](args);

        // STEP 4: Push tool response
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      } catch (err) {
        console.error("❌ Tool execution failed:", err.message);

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({
            error: err.message,
          }),
        });
      }
    }
  }
}

module.exports = { runAgent };