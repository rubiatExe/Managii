"""Configuration management for ResumeForge."""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .resumeforge.env in user's home directory
config_path = Path.home() / ".resumeforge.env"
if config_path.exists():
    load_dotenv(config_path)


class Config:
    """ResumeForge configuration."""
    
    @staticmethod
    def get_api_url() -> str:
        """Get the Managify API URL."""
        return os.getenv("MANAGIFY_API_URL", "http://localhost:3000")
    
    @staticmethod
    def get_gemini_api_key() -> str:
        """Get the Gemini API key."""
        key = os.getenv("GEMINI_API_KEY", "")
        if not key:
            raise ValueError(
                "GEMINI_API_KEY not set. Run 'resumeforge init' to configure."
            )
        return key
    
    @staticmethod
    def get_output_dir() -> Path:
        """Get the output directory for generated resumes."""
        default_dir = Path.home() / "Documents" / "Managify_Resumes"
        output_dir = Path(os.getenv("OUTPUT_DIR", str(default_dir)))
        output_dir.mkdir(parents=True, exist_ok=True)
        return output_dir
    
    @staticmethod
    def save_config(api_url: str, gemini_key: str, output_dir: str = ""):
        """Save configuration to .resumeforge.env file."""
        config_path = Path.home() / ".resumeforge.env"
        
        if not output_dir:
            output_dir = str(Path.home() / "Documents" / "Managify_Resumes")
        
        with open(config_path, "w") as f:
            f.write(f"MANAGIFY_API_URL={api_url}\n")
            f.write(f"GEMINI_API_KEY={gemini_key}\n")
            f.write(f"OUTPUT_DIR={output_dir}\n")
        
        return config_path
