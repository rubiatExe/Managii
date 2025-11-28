# ResumeForge Setup Guide

## Quick Start

ResumeForge is now integrated into Managify! You can use it in two ways:

### Option 1: Dashboard Integration (Recommended)

1. **Start Managify**:
   ```bash
   cd web
   npm run dev
   ```

2. **Upload your master resume** at `/resume`

3. **Save a job** using the Chrome extension

4. **Analyze the job** - Click "Analyze with Gemini AI"

5. **Download LaTeX Resume** - Click the purple "📄 Download Tailored LaTeX Resume" button

The tailored PDF will automatically download!

### Option 2: CLI Tool

1. **Install Python dependencies**:
   ```bash
   cd resumeforge
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Initialize configuration**:
   ```bash
   python -m resumeforge.cli init
   ```
   Enter:
   - Managify API URL: `http://localhost:3000`
   - Gemini API Key: (from your `.env` file)

3. **List available jobs**:
   ```bash
   python -m resumeforge.cli list-jobs
   ```

4. **Generate tailored resume**:
   ```bash
   python -m resumeforge.cli tailor <job-id>
   ```

   Resumes are saved to `~/Documents/Managify_Resumes/`

## Features

✅ **Intelligent Resume Parsing** - Gemini AI extracts all sections from your plain text resume

✅ **Job-Specific Tailoring** - Bullet points are rewritten to match job keywords

✅ **Professional LaTeX Templates** - ATS-friendly, modern design

✅ **Automatic PDF Compilation** - No LaTeX installation needed (uses online service)

✅ **Dashboard Integration** - One-click download from Managify UI

✅ **CLI Tool** - Batch process multiple jobs

## CLI Commands

| Command | Description |
|---------|-------------|
| `resumeforge init` | Set up configuration (API URL, Gemini key) |
| `resumeforge list-jobs` | View all saved jobs |
| `resumeforge list-jobs --status Applied` | Filter by status |
| `resumeforge list-jobs --category aiml` | Filter by category |
| `resumeforge tailor <job-id>` | Generate tailored resume |
| `resumeforge tailor <job-id> -o myresume` | Custom output name |
| `resumeforge tailor <job-id> --latex-only` | Skip PDF, save .tex only |
| `resumeforge check` | Verify setup and requirements |

## Output Files

Generated resumes are saved with descriptive names:

```
~/Documents/Managify_Resumes/
├── Google_Senior_Software_Engineer.pdf
├── Google_Senior_Software_Engineer.tex
├── Meta_ML_Engineer.pdf
└── Meta_ML_Engineer.tex
```

## How It Works

1. **Fetch Data**: Retrieves job description and master resume from Managify database

2. **Analyze**: Gemini AI analyzes job fit and generates optimized bullets (if you clicked "Analyze" first)

3. **Convert**: Gemini AI parses your resume into structured JSON (name, education, experience, etc.)

4. **Tailor**: Gemini AI rewrites ALL bullet points to include job-specific keywords

5. **Generate**: Creates LaTeX source code with professional formatting

6. **Compile**: Sends LaTeX to online compiler (latexonline.cc) and returns PDF

7. **Download**: PDF is automatically downloaded or saved to disk

## Troubleshooting

### "GEMINI_API_KEY is not set"
Make sure your `web/.env` file contains:
```env
GEMINI_API_KEY=your_api_key_here
```

### "No master resume found"
Upload a resume at `http://localhost:3000/resume` and mark it as "Active"

### "Failed to generate PDF"
The online LaTeX compiler may be temporarily down. Try again in a few minutes.

### CLI Can't Connect to API
Make sure Managify is running:
```bash
cd web
npm run dev
```

## Advanced Usage

### Using Different Output Directories

Edit `~/.resumeforge.env`:
```env
OUTPUT_DIR=/path/to/your/preferred/directory
```

### Viewing LaTeX Source

The `.tex` file is always saved alongside the PDF. You can:
- Edit it manually
- Compile locally with `pdflatex resume.tex` (if you have LaTeX installed)
- Import into Overleaf for online editing

## API Endpoint

The ResumeForge API endpoint is available at:

```
POST /api/resumeforge
Content-Type: application/json

{
  "jobId": "job-uuid-here"
}
```

Response:
```json
{
  "success": true,
  "latexSource": "\\documentclass...",
  "pdfBase64": "JVBERi0xLjMK...",
  "jobTitle": "Senior Software Engineer",
  "company": "Google"
}
```

## Next Steps

1. ✅ Install Python dependencies (optional, for CLI)
2. ✅ Upload your master resume
3. ✅ Save some jobs
4. ✅ Try the "Download LaTeX Resume" button!

---

**Built with ❤️ using Google Gemini AI**
