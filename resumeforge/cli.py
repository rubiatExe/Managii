#!/usr/bin/env python3
"""
ResumeForge CLI - Automated LaTeX Resume Generator
Integrates with Managify to tailor resumes for specific jobs.
"""

import click
import sys
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
from .config import Config
from .api_client import ManagifyClient
from .pdf_compiler import PdfCompiler

console = Console()


@click.group()
@click.version_option(version="1.0.0")
def cli():
    """ResumeForge - Automated LaTeX Resume Generator for Managify."""
    pass


@cli.command()
@click.option('--api-url', prompt='Managify API URL', default='http://localhost:3000', help='URL of your Managify instance')
@click.option('--gemini-key', prompt='Gemini API Key', hide_input=True, help='Your Google Gemini API key')
@click.option('--output-dir', default='', help='Directory to save generated resumes')
def init(api_url: str, gemini_key: str, output_dir: str):
    """Initialize ResumeForge configuration."""
    try:
        config_path = Config.save_config(api_url, gemini_key, output_dir)
        console.print(f"✅ Configuration saved to: [blue]{config_path}[/blue]", style="bold green")
        console.print(f"\n📁 Resumes will be saved to: [blue]{Config.get_output_dir()}[/blue]")
        console.print("\nYou're all set! Run [yellow]resumeforge list-jobs[/yellow] to get started.")
    except Exception as e:
        console.print(f"❌ Error: {e}", style="bold red")
        sys.exit(1)


@cli.command()
@click.option('--status', default=None, help='Filter by status (Applied, Interviewing, etc.)')
@click.option('--category', default=None, help='Filter by category (sde, aiml, cv, nlp, robo)')
def list_jobs(status: str, category: str):
    """List all jobs from Managify."""
    try:
        client = ManagifyClient()
        
        with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}")) as progress:
            progress.add_task(description="Fetching jobs...", total=None)
            jobs = client.list_jobs()
        
        if not jobs:
            console.print("📭 No jobs found.", style="yellow")
            return
        
        # Apply filters
        if status:
            jobs = [j for j in jobs if j.get('status', '').lower() == status.lower()]
        if category:
            jobs = [j for j in jobs if j.get('category', '').lower() == category.lower()]
        
        # Create table
        table = Table(title=f"📋 Jobs ({len(jobs)} total)")
        table.add_column("ID", style="cyan", no_wrap=True)
        table.add_column("Title", style="green")
        table.add_column("Company", style="blue")
        table.add_column("Status", style="yellow")
        table.add_column("Category", style="magenta")
        
        for job in jobs:
            table.add_row(
                job.get('id', '')[:8] + "...",
                job.get('title', 'N/A'),
                job.get('company', 'N/A'),
                job.get('status', 'N/A'),
                job.get('category', 'N/A').upper()
            )
        
        console.print(table)
        console.print(f"\n💡 Run [yellow]resumeforge tailor <job-id>[/yellow] to generate a tailored resume")
        
    except Exception as e:
        console.print(f"❌ Error: {e}", style="bold red")
        sys.exit(1)


@cli.command()
@click.argument('job_id')
@click.option('--output', '-o', default=None, help='Output filename (without extension)')
@click.option('--latex-only', is_flag=True, help='Only save LaTeX source, skip PDF compilation')
def tailor(job_id: str, output: str, latex_only: bool):
    """Generate a tailored LaTeX resume for a specific job."""
    try:
        client = ManagifyClient()
        output_dir = Config.get_output_dir()
        
        console.print(f"🎯 Tailoring resume for job: [cyan]{job_id}[/cyan]")
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            # Step 1: Call API
            task1 = progress.add_task(description="Generating LaTeX resume with Gemini AI...", total=None)
            result = client.generate_latex_resume(job_id)
            progress.remove_task(task1)
            
            # Determine output filename
            if not output:
                job_title = result.get('jobTitle', 'resume')
                company = result.get('company', 'company')
                # Clean filename
                safe_title = "".join(c if c.isalnum() else "_" for c in job_title)[:30]
                safe_company = "".join(c if c.isalnum() else "_" for c in company)[:20]
                output = f"{safe_company}_{safe_title}"
            
            output_path = output_dir / output
            
            # Step 2: Save LaTeX source
            task2 = progress.add_task(description="Saving LaTeX source...", total=None)
            latex_file = output_path.with_suffix('.tex')
            latex_file.write_text(result['latexSource'], encoding='utf-8')
            progress.remove_task(task2)
            
            console.print(f"✅ LaTeX source saved: [blue]{latex_file}[/blue]")
            
            if not latex_only and result.get('pdfBase64'):
                # API returned a PDF - save it
                task3 = progress.add_task(description="Saving PDF...", total=None)
                
                if PdfCompiler.save_from_base64(result['pdfBase64'], output_path):
                    pdf_file = output_path.with_suffix('.pdf')
                    progress.remove_task(task3)
                    console.print(f"✅ PDF saved: [blue]{pdf_file}[/blue]", style="bold green")
                else:
                    progress.remove_task(task3)
                    console.print("⚠️  PDF save failed", style="yellow")
            elif not latex_only:
                # Compile locally using pdflatex
                task3 = progress.add_task(description="Compiling PDF with pdflatex...", total=None)
                
                if PdfCompiler.compile(result['latexSource'], output_path):
                    pdf_file = output_path.with_suffix('.pdf')
                    progress.remove_task(task3)
                    console.print(f"✅ PDF compiled: [blue]{pdf_file}[/blue]", style="bold green")
                else:
                    progress.remove_task(task3)
                    console.print("⚠️  PDF compilation failed - you can manually compile the .tex file", style="yellow")
        
        console.print(f"\n🎉 Resume tailored successfully for [green]{result.get('jobTitle')}[/green] at [blue]{result.get('company')}[/blue]!")
        
    except Exception as e:
        console.print(f"❌ Error: {e}", style="bold red")
        sys.exit(1)


@cli.command()
def check():
    """Check system requirements and configuration."""
    console.print("🔍 Checking ResumeForge setup...\n")
    
    # Check config
    try:
        api_url = Config.get_api_url()
        console.print(f"✅ API URL: [blue]{api_url}[/blue]")
    except Exception as e:
        console.print(f"❌ Configuration error: {e}", style="red")
        console.print("   Run [yellow]resumeforge init[/yellow] to configure")
        return
    
    # Check LaTeX
    if PdfCompiler.check_latex_installed():
        console.print("✅ LaTeX installed: [green]pdflatex found[/green]")
    else:
        console.print("❌ LaTeX not installed", style="red")
        console.print("   Install instructions:")
        console.print("     macOS:   [yellow]brew install --cask basictex[/yellow]")
        console.print("     Linux:   [yellow]sudo apt-get install texlive-latex-base texlive-latex-extra[/yellow]")
        console.print("     Windows: [blue]https://miktex.org/download[/blue]")
    
    # Check API connection
    try:
        client = ManagifyClient()
        jobs = client.list_jobs()
        console.print(f"✅ Managify API: [green]Connected[/green] ({len(jobs)} jobs found)")
    except Exception as e:
        console.print(f"❌ Managify API: [red]Connection failed[/red]")
        console.print(f"   Error: {e}")
    
    # Check output directory
    output_dir = Config.get_output_dir()
    console.print(f"✅ Output directory: [blue]{output_dir}[/blue]")
    
    console.print("\n✨ All checks complete!")


if __name__ == "__main__":
    cli()
