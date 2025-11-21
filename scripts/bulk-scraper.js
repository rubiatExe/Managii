#!/usr/bin/env node

/**
 * Managify Bulk Job Scraper
 * Searches Google for job listings and scrapes them in bulk
 * Inspired by the Python job scraper script
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const cheerio = require('cheerio');
const { Command } = require('commander');

const prisma = new PrismaClient();

// Import filter logic from extension (we'll redefine it here for Node.js)
const keywordsDict = {
    'sde': ["software development", "software engineer", "software engineering",
        "software developer", "development", "backend engineer", "sde", "swe", "backend",
        "frontend", "fullstack", "full", "stack", "front", "system", "systems",
        "cloud", "devops", "application", "api", "platform", "site"],
    'aiml': ["machine learning", "artificial intelligence", "ai", "ml", "mlops",
        "cloud", "devops", "generative", "deep", "data", "applied"],
    'cv': ["computer vision", "computer", "vision", "perception", "cv", "image", "object", "detection",
        "autonomous"],
    'nlp': ["nlp", "natural language processing", "llm", "generative", "linguist",
        "language", "applied"],
    'robo': ["robotics", "robot", "mechatronics", "automation", "autonomous"],
};

const ignoreDict = {
    'title': ["staff", "sr.", "sr", "senior", "manager", "lead", "chief", "principal", "director",
        "sales", "head", "mechanical", "ii", "iii", "iv", "l2", "l3", "2", "3", "4",
        "management", "consultant", "phd", "manufacturing", "law", "maintenance",
        "construction", "clearance", "structures", "helpdesk", "electrical", "propulsion",
        "solution", "solutions", "customer"],
    'description': ["clearance", "itar"]
};

// Clean URLs to remove tracking parameters
function cleanURL(jobUrl) {
    if (jobUrl.includes("lever.co")) {
        const pathParts = jobUrl.split('/');
        if (pathParts.length > 4) {
            pathParts[4] = pathParts[4].substring(0, 36);
            return pathParts.slice(0, 5).join('/');
        }
    }

    if (jobUrl.includes("greenhouse.io")) {
        const pathParts = jobUrl.split("/");
        if (pathParts.length > 5) {
            const numericPart = pathParts[5].replace(/\D/g, '');
            pathParts[5] = numericPart;
            return pathParts.slice(0, 6).join('/');
        }
    }

    return jobUrl;
}

// Scrape job details from a URL
async function scrapeJobDetails(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);

        const jobDetails = {
            company: 'N/A',
            title: 'N/A',
            location: 'N/A',
            description: 'N/A',
            url
        };

        // Greenhouse scraping
        if (url.includes('greenhouse')) {
            const companySpan = $('.company-name').text().trim();
            jobDetails.company = companySpan ? companySpan.substring(3) : 'N/A';
            jobDetails.title = $('.app-title').text().trim() || 'N/A';
            jobDetails.location = $('.location').text().trim() || 'N/A';
            jobDetails.description = $('#content').text().trim() || 'N/A';
        }

        // Lever scraping
        if (url.includes('lever')) {
            const titleTag = $('title').text();
            if (titleTag) {
                const parts = titleTag.split(' - ');
                if (parts.length >= 2) {
                    jobDetails.company = parts[0].trim();
                    jobDetails.title = parts[1].trim();
                }
            }

            const locationDiv = $('.posting-categories .location').text().trim();
            if (locationDiv) jobDetails.location = locationDiv;

            const descDiv = $('[data-qa="job-description"]').text().trim();
            if (descDiv) jobDetails.description = descDiv;
        }

        return jobDetails;
    } catch (error) {
        console.error(`Failed to scrape ${url}:`, error.message);
        return null;
    }
}

// Determine job category
function determineCategory(title, description) {
    const titleLower = (title || '').toLowerCase();
    const descLower = (description || '').toLowerCase();

    const scores = {};
    for (const [category, keywords] of Object.entries(keywordsDict)) {
        let score = 0;
        for (const keyword of keywords) {
            if (titleLower.includes(keyword.toLowerCase())) score += 2;
            if (descLower.includes(keyword.toLowerCase())) score += 1;
        }
        scores[category] = score;
    }

    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return null;

    return Object.keys(scores).find(key => scores[key] === maxScore);
}

// Check if job is relevant
function isRelevantRole(title, description) {
    if (!title && !description) return true;

    const titleLower = (title || '').toLowerCase();
    const descLower = (description || '').toLowerCase();

    for (const ignored of ignoreDict.title) {
        if (titleLower.includes(ignored)) return false;
    }

    for (const ignored of ignoreDict.description) {
        if (descLower.includes(ignored)) return false;
    }

    const allKeywords = Object.values(keywordsDict).flat();
    for (const keyword of allKeywords) {
        if (titleLower.includes(keyword.toLowerCase()) || descLower.includes(keyword.toLowerCase())) {
            return true;
        }
    }

    return false;
}

// Save job to database
async function saveJob(jobData) {
    try {
        // Check if job already exists
        const existing = await prisma.job.findFirst({
            where: { url: jobData.url }
        });

        if (existing) {
            console.log(`  ⏭️  Skipping duplicate: ${jobData.title}`);
            return { success: false, duplicate: true };
        }

        await prisma.job.create({
            data: {
                title: jobData.title,
                company: jobData.company,
                description: jobData.description,
                url: jobData.url,
                location: jobData.location,
                category: jobData.category,
                isRelevant: jobData.isRelevant,
                status: 'Applied'
            }
        });

        console.log(`  ✅ Saved: ${jobData.title} at ${jobData.company}`);
        return { success: true };
    } catch (error) {
        console.error(`  ❌ Failed to save job:`, error.message);
        return { success: false, error: error.message };
    }
}

// Main function
async function main() {
    const program = new Command();

    program
        .name('bulk-scraper')
        .description('Bulk job scraper for Managify')
        .option('-u, --urls <urls...>', 'List of job URLs to scrape')
        .option('-f, --file <path>', 'File containing job URLs (one per line)')
        .option('-c, --category <category>', 'Filter by category (sde, aiml, cv, nlp, robo)')
        .option('--relevant-only', 'Only save relevant jobs', false)
        .parse(process.argv);

    const options = program.opts();

    let urls = [];

    if (options.urls) {
        urls = options.urls;
    } else if (options.file) {
        const fs = require('fs');
        const content = fs.readFileSync(options.file, 'utf-8');
        urls = content.split('\n').filter(line => line.trim().length > 0);
    } else {
        console.error('❌ Please provide URLs via --urls or --file');
        process.exit(1);
    }

    console.log(`\n🔍 Starting bulk scrape of ${urls.length} URLs...\n`);

    const stats = {
        total: urls.length,
        scraped: 0,
        saved: 0,
        skipped: 0,
        failed: 0
    };

    for (const url of urls) {
        const cleanedUrl = cleanURL(url.trim());
        console.log(`\n📄 Scraping: ${cleanedUrl}`);

        const jobData = await scrapeJobDetails(cleanedUrl);

        if (!jobData) {
            stats.failed++;
            continue;
        }

        stats.scraped++;

        // Analyze job
        const category = determineCategory(jobData.title, jobData.description);
        const isRelevant = isRelevantRole(jobData.title, jobData.description);

        console.log(`  📊 Category: ${category || 'N/A'}, Relevant: ${isRelevant ? 'Yes' : 'No'}`);

        // Apply filters
        if (options.category && category !== options.category) {
            console.log(`  ⏭️  Skipping: Category mismatch`);
            stats.skipped++;
            continue;
        }

        if (options.relevantOnly && !isRelevant) {
            console.log(`  ⏭️  Skipping: Not relevant`);
            stats.skipped++;
            continue;
        }

        jobData.category = category;
        jobData.isRelevant = isRelevant;

        const result = await saveJob(jobData);
        if (result.success) {
            stats.saved++;
        } else if (result.duplicate) {
            stats.skipped++;
        } else {
            stats.failed++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 SCRAPING SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total URLs: ${stats.total}`);
    console.log(`Scraped: ${stats.scraped}`);
    console.log(`Saved: ${stats.saved}`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Failed: ${stats.failed}`);
    console.log('='.repeat(50) + '\n');

    await prisma.$disconnect();
}

main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
