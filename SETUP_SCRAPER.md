# Managify Setup Instructions

## Database Migration

The job scraper enhancements require database schema changes. Follow these steps to apply the migration:

### Prerequisites
- PostgreSQL database must be running
- Database connection string must be configured in `web/.env`

### Steps

1. **Start your PostgreSQL database** (if not already running):
   - If using Cloud SQL Proxy: `./cloud-sql-proxy`
   - If using local PostgreSQL: Ensure it's running on `localhost:5432`

2. **Navigate to the web directory**:
   ```bash
   cd web
   ```

3. **Run the database migration**:
   ```bash
   npx prisma migrate dev --name add_job_filters
   ```
   
   This will:
   - Add `location`, `category`, and `isRelevant` fields to the Job model
   - Regenerate the Prisma client (fixes TypeScript lint errors)

4. **Verify the migration**:
   ```bash
   npx prisma studio
   ```
   - Open Prisma Studio in your browser
   - Click on the "Job" model
   - Verify that the new fields appear

### If Migration Fails

If the migration fails with "Can't reach database server":
1. Check your `.env` file has the correct `DATABASE_URL`
2. Ensure your database is running
3. Test connection: `node test-db-connection.js`

## Installing Dependencies

Install the new dependencies for the bulk scraper:

```bash
cd web
npm install
```

This will install:
- `axios` - HTTP client for web scraping
- `cheerio` - HTML parsing library  
- `commander` - CLI argument parsing

## Using the Bulk Scraper

The bulk scraper can scrape multiple job URLs at once and save them to the database.

### Basic Usage

**Scrape specific URLs**:
```bash
npm run bulk-scraper -- --urls https://jobs.lever.co/company/job-id https://boards.greenhouse.io/company/jobs/12345
```

**Scrape from a file**:
```bash
npm run bulk-scraper -- --file urls.txt
```

Create `urls.txt` with one URL per line:
```
https://jobs.lever.co/company/job-id-1
https://boards.greenhouse.io/company/jobs/12345
https://jobs.lever.co/company/job-id-2
```

### Advanced Options

**Filter by category**:
```bash
npm run bulk-scraper -- --file urls.txt --category sde
```
Only saves jobs categorized as "sde" (Software Development)

**Only relevant jobs**:
```bash
npm run bulk-scraper -- --file urls.txt --relevant-only
```
Filters out jobs with ignore keywords (senior, manager, clearance, etc.)

**Combine filters**:
```bash
npm run bulk-scraper -- --file urls.txt --category aiml --relevant-only
```
Only saves relevant AI/ML jobs

### Categories

- `sde` - Software Development & Engineering
- `aiml` - AI/ML & Data Science
- `cv` - Computer Vision
- `nlp` - Natural Language Processing
- `robo` - Robotics

## Chrome Extension Updates

The extension now includes:

1. **Automatic categorization** - Jobs are automatically tagged with a category
2. **Relevance filtering** - Jobs with ignore keywords are filtered out
3. **Location extraction** - Job location is extracted and saved
4. **Visual badges** - Category badges appear on the "Save to Managify" button

### Loading the Updated Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Remove" on the old Managify extension
4. Click "Load unpacked"
5. Select the `extension` folder
6. Navigate to any job page (Lever, Greenhouse, LinkedIn, Indeed)
7. You should see the "Save to Managify" button with a category badge

## Troubleshooting

### Lint Error: "location does not exist in type"

This error appears because the Prisma client hasn't been regenerated yet. Run the migration (see above) to fix it.

### Extension Badge Not Showing

1. Check browser console for errors (F12)
2. Verify `filters.js` is loaded: Look for "Managify content script loaded" in console
3. Reload the extension and refresh the job page

### Bulk Scraper Failing

1. Check your database connection
2. Verify the URLs are valid Lever or Greenhouse links
3. Check for rate limiting (script waits 1 second between requests)
4. Review console output for specific errors

## Next Steps

1. ✅ Run the database migration
2. ✅ Install dependencies: `npm install`
3. ✅ Reload the Chrome extension
4. 🎯 Test the bulk scraper with a few job URLs
5. 🎯 Start saving jobs and see the categorization in action!
