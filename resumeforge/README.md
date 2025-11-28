# ResumeForge - LaTeX Resume Automation Tool

🚀 **ResumeForge** is a CLI tool that integrates with Managify to automatically convert your master resume to LaTeX format and tailor it for specific job descriptions using Google Gemini AI.

## Features

- 📝 **Convert resume to professional LaTeX format**
- 🎯 **Auto-tailor bullet points** to match job keywords using Gemini AI
- 📄 **Compile PDF** automatically with pdflatex
- 🔗 **Seamless Managify integration** - fetch jobs and resumes directly
- ✨ **Beautiful CLI** with progress indicators and colored output

## Installation

### Prerequisites

1. **Python 3.8+** installed
2. **LaTeX distribution** (pdflatex):
   - macOS: `brew install --cask basictex`
   - Linux: `sudo apt-get install texlive-latex-base texlive-latex-extra`
   - Windows: [Download MiKTeX](https://miktex.org/download)

### Setup

```bash
cd resumeforge
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Usage

### 1. Initialize Configuration

```bash
python -m resumeforge.cli init
```

This will prompt you for:
- Managify API URL (default: `http://localhost:3000`)
- Gemini API Key
- Output directory (optional)

### 2. List Available Jobs

```bash
# List all jobs
python -m resumeforge.cli list-jobs

# Filter by status
python -m resumeforge.cli list-jobs --status Applied

# Filter by category
python -m resumeforge.cli list-jobs --category aiml
```

### 3. Generate Tailored Resume

```bash
# Tailor resume for a specific job
python -m resumeforge.cli tailor <job-id>

# Custom output filename
python -m resumeforge.cli tailor <job-id> --output my_resume

# Generate LaTeX only (skip PDF)
python -m resumeforge.cli tailor <job-id> --latex-only
```

### 4. Check System Requirements

```bash
python -m resumeforge.cli check
```

## How It Works

1. **Fetch Data**: Retrieves job description and master resume from Managify
2. **AI Processing**: Gemini AI converts resume to LaTeX and optimizes content for the job
3. **Compilation**: Generates both `.tex` and `.pdf` files
4. **Output**: Saves to `~/Documents/Managify_Resumes/` (configurable)

## File Naming

Generated files are automatically named based on company and job title:
```
Google_Senior_Software_Engineer.tex
Google_Senior_Software_Engineer.pdf
```

## Troubleshooting

### LaTeX Not Found
Run `python -m resumeforge.cli check` to verify LaTeX installation.

### API Connection Failed
Ensure Managify is running:
```bash
cd ../web
npm run dev
```

### Permission Errors
Make sure the output directory is writable. Change it in `~/.resumeforge.env`.

## Configuration File

Configuration is stored in `~/.resumeforge.env`:
```env
MANAGIFY_API_URL=http://localhost:3000
GEMINI_API_KEY=your_api_key_here
OUTPUT_DIR=/Users/you/Documents/Managify_Resumes
```

## Development

Run the CLI in development mode:
```bash
python -m resumeforge.cli --help
```

## License

MIT License - see LICENSE file for details
