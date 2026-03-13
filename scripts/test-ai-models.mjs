import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// Load .env.local manually with robust parsing
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...value] = trimmed.split('=');
    if (key && value) env[key.trim()] = value.join('=').trim();
});

const GEMINI_API_KEY = env.GEMINI_API_KEY;
const OPENAI_API_KEY = env.OPENAI_API_KEY;
const GROQ_API_KEY = env.GROQ_API_KEY;
const DEEPSEEK_API_KEY = env.DEEPSEEK_API_KEY;

console.log("------------------------------------------");
console.log("🛡️  AI QUOTA & CONNECTIVITY TESTER");
console.log("------------------------------------------\n");

async function testGenericOpenAI(providerName, apiKey, baseURL, models) {
    console.log(`🟡 TESTING ${providerName} MODELS...`);
    if (!apiKey) {
        console.log(`❌ ${providerName}_API_KEY missing in .env.local\n`);
        return;
    }

    const client = new OpenAI({ apiKey, baseURL });

    for (const model of models) {
        try {
            const start = Date.now();
            const completion = await client.chat.completions.create({
                model: model,
                messages: [{ role: "user", content: "Say 'Ready'" }],
                max_tokens: 5
            });
            const latency = Date.now() - start;
            console.log(`✅ ${model.padEnd(25)} | Status: ACTIVE | Latency: ${latency}ms | Response: ${completion.choices[0].message.content.trim()}`);
        } catch (err) {
            console.log(`❌ ${model.padEnd(25)} | Status: FAILED | Error: ${err.message}`);
        }
    }
    console.log("");
}

async function testOpenAI() {
    await testGenericOpenAI("OPENAI", OPENAI_API_KEY, undefined, ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"]);
}

async function testGroq() {
    await testGenericOpenAI("GROQ", GROQ_API_KEY, "https://api.groq.com/openai/v1", ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"]);
}

async function testDeepSeek() {
    await testGenericOpenAI("DEEPSEEK", DEEPSEEK_API_KEY, "https://api.deepseek.com", ["deepseek-chat"]);
}

async function testGemini() {
    console.log("🟣 TESTING GEMINI MODELS...");
    if (!GEMINI_API_KEY) {
        console.log("❌ GEMINI_API_KEY missing in .env.local\n");
        return;
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-1.5-pro"];

    for (const modelId of models) {
        try {
            const start = Date.now();
            const model = genAI.getGenerativeModel({ model: modelId });
            const result = await model.generateContent("Say 'Ready'");
            const response = await result.response;
            const latency = Date.now() - start;
            console.log(`✅ ${modelId.padEnd(25)} | Status: ACTIVE | Latency: ${latency}ms | Response: ${response.text().trim()}`);
        } catch (err) {
            console.log(`❌ ${modelId.padEnd(25)} | Status: FAILED | Error: ${err.message}`);
        }
    }
    console.log("");
}

async function runTests() {
    try {
        await testOpenAI();
        await testGroq();
        await testDeepSeek();
        await testGemini();
        console.log("------------------------------------------");
        console.log("✅ TEST COMPLETE.");
        console.log("------------------------------------------");
    } catch (err) {
        console.error("FATAL ERROR DURING TEST:", err);
    }
}

runTests();
