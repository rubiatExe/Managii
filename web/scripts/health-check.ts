const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const prisma = new PrismaClient();

async function checkDatabase() {
    console.log("1. Checking Database Connection...");
    try {
        const userCount = await prisma.user.count();
        console.log(`✅ Database Connected! Found ${userCount} users.`);
        return true;
    } catch (error: any) {
        console.error("❌ Database Connection Failed:", error.message);
        return false;
    }
}

async function checkGemini() {
    console.log("\n2. Checking Gemini API...");
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ GEMINI_API_KEY is missing in .env");
        return false;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Say 'Hello World'");
        const response = await result.response;
        const text = response.text();
        if (text) {
            console.log(`✅ Gemini API Working! Response: "${text.trim()}"`);
            return true;
        } else {
            console.error("❌ Gemini API returned empty response");
            return false;
        }
    } catch (error: any) {
        console.error("❌ Gemini API Failed:", error.message);
        return false;
    }
}

async function checkPDFCompiler() {
    console.log("\n3. Checking PDF Compiler (pdflatex)...");
    return new Promise((resolve) => {
        exec('pdflatex --version', (error: any, stdout: any, stderr: any) => {
            if (error) {
                console.error("❌ pdflatex not found or failed:", error.message);
                resolve(false);
            } else {
                const version = stdout.split('\n')[0];
                console.log(`✅ pdflatex Found! Version: ${version}`);
                resolve(true);
            }
        });
    });
}

async function main() {
    console.log("🔍 Starting System Health Check...\n");

    const dbOk = await checkDatabase();
    const geminiOk = await checkGemini();
    const pdfOk = await checkPDFCompiler();

    console.log("\n----------------------------------------");
    if (dbOk && geminiOk && pdfOk) {
        console.log("🚀 ALL SYSTEMS GO! The project is fully functional.");
        process.exit(0);
    } else {
        console.error("⚠️ Some systems are failing. Please check the logs above.");
        process.exit(1);
    }
}

main();
