import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) env[key.trim()] = value.join('=').trim();
});

const GEMINI_API_KEY = env.GEMINI_API_KEY;
const OPENAI_API_KEY = env.OPENAI_API_KEY;

console.log("------------------------------------------");
console.log("🛡️  AI QUOTA & CONNECTIVITY TESTER");
console.log("------------------------------------------\n");

async function testOpenAI() {
    console.log("🔵 TESTING OPENAI MODELS...");
    if (!OPENAI_API_KEY) {
        console.log("❌ OPENAI_API_KEY missing in .env.local\n");
        return;
    }

    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    const models = ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"];

    for (const model of models) {
        try {
            const start = Date.now();
            const completion = await openai.chat.completions.create({
                model: model,
                messages: [{ role: "user", content: "Say 'Ready'" }],
                max_tokens: 5
            });
            const latency = Date.now() - start;
            console.log(`✅ ${model.padEnd(16)} | Status: ACTIVE | Latency: ${latency}ms | Response: ${completion.choices[0].message.content.trim()}`);
        } catch (err) {
            console.log(`❌ ${model.padEnd(16)} | Status: FAILED | Error: ${err.message}`);
        }
    }
    console.log("");
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
            console.log(`✅ ${modelId.padEnd(20)} | Status: ACTIVE | Latency: ${latency}ms | Response: ${response.text().trim()}`);
        } catch (err) {
            console.log(`❌ ${modelId.padEnd(20)} | Status: FAILED | Error: ${err.message}`);
        }
    }
    console.log("");
}

async function runTests() {
    try {
        await testOpenAI();
        await testGemini();
        console.log("------------------------------------------");
        console.log("✅ TEST COMPLETE.");
        console.log("------------------------------------------");
    } catch (err) {
        console.error("FATAL ERROR DURING TEST:", err);
    }
}

runTests();
