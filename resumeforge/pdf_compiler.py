"""PDF compilation from LaTeX source."""

import subprocess
import tempfile
from pathlib import Path
from typing import Optional
import base64


class PdfCompiler:
    """Compile LaTeX source to PDF."""
    
    @staticmethod
    def check_latex_installed() -> bool:
        """Check if pdflatex is installed and available."""
        try:
            result = subprocess.run(
                ["pdflatex", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except (subprocess.SubprocessError, FileNotFoundError):
            return False
    
    @staticmethod
    def compile(latex_source: str, output_path: Path) -> bool:
        """
        Compile LaTeX source to PDF.
        
        Args:
            latex_source: LaTeX source code as string
            output_path: Path where the PDF should be saved (without .pdf extension)
        
        Returns:
            True if compilation succeeded, False otherwise
        """
        if not PdfCompiler.check_latex_installed():
            raise RuntimeError(
                "pdflatex not found. Please install a LaTeX distribution:\n"
                "  macOS: brew install --cask basictex\n"
                "  Linux: sudo apt-get install texlive-latex-base texlive-latex-extra\n"
                "  Windows: https://miktex.org/download"
            )
        
        # Create a temporary directory for compilation
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir_path = Path(tmpdir)
            tex_file = tmpdir_path / "resume.tex"
            
            # Write LaTeX source to temp file
            tex_file.write_text(latex_source, encoding='utf-8')
            
            try:
                # Run pdflatex twice to resolve references
                for _ in range(2):
                    result = subprocess.run(
                        [
                            "pdflatex",
                            "-interaction=nonstopmode",
                            "-output-directory", str(tmpdir_path),
                            str(tex_file)
                        ],
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                    
                    if result.returncode != 0:
                        print("LaTeX compilation error:")
                        print(result.stdout)
                        return False
                
                # Move the generated PDF to the output location
                pdf_file = tmpdir_path / "resume.pdf"
                if pdf_file.exists():
                    output_pdf = output_path.with_suffix('.pdf')
                    output_pdf.write_bytes(pdf_file.read_bytes())
                    return True
                else:
                    print("PDF file was not generated")
                    return False
                    
            except subprocess.TimeoutExpired:
                print("LaTeX compilation timed out")
                return False
            except Exception as e:
                print(f"Error during compilation: {e}")
                return False
    
    @staticmethod
    def save_from_base64(base64_data: str, output_path: Path) -> bool:
        """
        Save a base64-encoded PDF to file.
        
        Args:
            base64_data: Base64-encoded PDF data
            output_path: Path where the PDF should be saved
        
        Returns:
            True if save succeeded, False otherwise
        """
        try:
            pdf_bytes = base64.b64decode(base64_data)
            output_pdf = output_path.with_suffix('.pdf')
            output_pdf.write_bytes(pdf_bytes)
            return True
        except Exception as e:
            print(f"Error saving PDF: {e}")
            return False
