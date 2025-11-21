# 🚀 Managify - AI-Powered Job Application Tracker

**Managify** is an intelligent job application management system that helps you track, organize, and optimize your job search with AI-powered resume tailoring and smart job categorization.

![Dashboard View](/.gemini/antigravity/brain/f7755ea7-b9ee-41bc-ae08-445497ed7064/dashboard_view_1763762915045.png)

## ✨ Features

### 📌 Smart Job Tracking
- **One-click save** jobs from any job board with our Chrome extension
- **Automatic categorization** into Software Development, AI/ML, Computer Vision, NLP, and Robotics
- **Location filtering** with USA-specific location detection
- **Intelligent relevance scoring** based on keywords and ignore patterns
- **Beautiful job descriptions** with proper formatting, bullet points, and paragraph spacing

### 🤖 AI-Powered Resume Tailoring
- Upload your base resume and let AI customize it for each job
- Gemini AI analyzes job descriptions and tailors your resume automatically
- Download professionally formatted, ATS-optimized PDFs
- Track which resume version you used for each application

### 🎯 Chrome Extension
- **Floating "Save to Managify" button** appears on supported job sites
- **Works on**: LinkedIn, Indeed, Greenhouse, Lever, BambooHR, Workday, and more
- **Color-coded badges** show job category at a glance
- **Real-time sync** with your dashboard

![Job Details View](/.gemini/antigravity/brain/f7755ea7-b9ee-41bc-ae08-445497ed7064/job_details_view_1763762944941.png)

### 📊 Advanced Filtering
- Filter jobs by category (SDE, AI/ML, CV, NLP, Robotics)
- Filter by relevance score
- Search by company, title, or description
- Track application status (Not Applied, Applied, Interviewing, Offer, Rejected)

## 🛠️ Tech Stack

**Frontend:**
- Next.js 16 (React)
- TypeScript
- TailwindCSS
- Lucide Icons

**Backend:**
- Next.js API Routes
- Prisma ORM
- PostgreSQL (Google Cloud SQL)

**AI:**
- Google Gemini 2.0 Flash
- Advanced prompt engineering for resume tailoring

**Chrome Extension:**
- Vanilla JavaScript
- Content Scripts
- Background Service Worker

## 📦 Installation

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (or Google Cloud SQL)
- Google Cloud account (for Gemini API)

### 1. Clone the Repository
```bash
git clone https://github.com/rubiatExe/Managii.git
cd Managify
```

### 2. Set Up the Web Application

```bash
cd web
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `web/` directory:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Google Cloud
GOOGLE_CLOUD_PROJECT="your-project-id"
GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"

# Gemini API
GEMINI_API_KEY="your-gemini-api-key"
```

### 4. Run Database Migrations

```bash
npx prisma migrate deploy
npx prisma generate
```

### 5. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### 6. Install Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `extension/` folder from this repository
5. The Managify extension is now active!

## 🎮 Usage

### Saving Jobs with the Chrome Extension

1. **Navigate to any job posting** on supported sites (LinkedIn, Indeed, Greenhouse, Lever, Workday, etc.)
2. **Look for the floating "Save to Managify" button** in the bottom-right corner
3. **Click the button** to save the job
   - The button will show "Saving..." while processing
   - On success, it shows "Saved!" with a green checkmark
   - Category badge indicates the job type (SDE, AI/ML, etc.)
4. **View the job** in your dashboard at [http://localhost:3000](http://localhost:3000)

### Managing Jobs in the Dashboard

**View all jobs:**
- Jobs are displayed in a sortable table
- Click column headers to sort (Title, Company, Status, etc.)
- Color-coded category badges for quick identification

**Filter jobs:**
- Use the search bar to find specific jobs
- Filter by category using the dropdown
- Filter by application status

**View job details:**
- Click any job to view full description
- See location, company, and category
- Access the original job posting URL

### AI Resume Tailoring

1. **Upload your base resume** in the Resume Manager
2. **Click "Tailor Resume"** on any job
3. **AI analyzes** the job description and customizes your resume
4. **Download** the tailored PDF
5. **Track** which resume version you used for each application

## 🔧 Advanced Features

### Bulk Job Scraper

Import multiple jobs at once using the CLI tool:

```bash
cd web
npm run scraper -- --file jobs.txt
```

Or provide URLs directly:

```bash
npm run scraper -- --urls "https://job1.com" "https://job2.com"
```

See [SETUP_SCRAPER.md](./SETUP_SCRAPER.md) for detailed instructions.

### Job Categorization

Jobs are automatically categorized based on keywords:

- 🔵 **Software Development**: Full-stack, backend, frontend, mobile
- 🟣 **AI/ML**: Machine learning, deep learning, neural networks
- 🔴 **Computer Vision**: Image processing, object detection, OCR
- 🟢 **NLP**: Natural language processing, text analysis, chatbots
- 🟡 **Robotics**: Autonomous systems, sensors, ROS

### Relevance Filtering

Jobs are marked as irrelevant if they contain these keywords:
- Senior/Staff/Principal roles (unless you want them)
- Management positions
- Security clearance required
- Sales/marketing roles
- And more... (see `extension/filters.js`)

## 📁 Project Structure

```
Managify/
├── extension/              # Chrome Extension
│   ├── manifest.json       # Extension configuration
│   ├── content.js          # Job scraping logic
│   ├── background.js       # API communication
│   ├── filters.js          # Categorization & filtering
│   ├── popup.html          # Extension popup UI
│   └── floating-button.css # Floating button styles
├── web/                    # Next.js Application
│   ├── app/                # Pages & API routes
│   ├── components/         # React components
│   ├── lib/                # Utilities (Prisma, Gemini)
│   ├── prisma/             # Database schema & migrations
│   └── public/             # Static assets
├── scripts/                # CLI tools
│   └── bulk-scraper.js     # Bulk job import tool
├── SETUP_SCRAPER.md        # Scraper setup guide
└── README.md               # You are here!
```

## 🚀 Deployment

### Deploy to Vercel

1. **Push your code to GitHub**
2. **Import to Vercel**: [vercel.com/new](https://vercel.com/new)
3. **Add environment variables** in Vercel dashboard
4. **Deploy!**

### Database Setup

**Option 1: Google Cloud SQL** (Recommended)
- Managed PostgreSQL database
- Easy integration with Cloud Run
- Built-in backups and scaling

**Option 2: Vercel Postgres**
- Native Vercel integration
- Serverless PostgreSQL
- Simple setup

See [finish_setup.sh](./finish_setup.sh) for database configuration.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Google Gemini** for AI-powered resume tailoring
- **Workday, Greenhouse, Lever** and other job boards for job data
- **Next.js** and **Vercel** for the amazing framework

## 📧 Contact

Created by [@rubiatExe](https://github.com/rubiatExe)

---

**Made with ❤️ and AI to help you land your dream job!**
