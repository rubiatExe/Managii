"""API client for communicating with Managify backend."""

import requests
from typing import List, Dict, Optional
from .config import Config


class ManagifyClient:
    """Client for interacting with Managify API."""
    
    def __init__(self):
        self.base_url = Config.get_api_url()
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json"
        })
    
    def list_jobs(self) -> List[Dict]:
        """Fetch all jobs from Managify."""
        try:
            response = self.session.get(f"{self.base_url}/api/jobs")
            response.raise_for_status()
            data = response.json()
            return data.get("jobs", [])
        except requests.RequestException as e:
            raise Exception(f"Failed to fetch jobs: {e}")
    
    def get_job(self, job_id: str) -> Dict:
        """Fetch a specific job by ID."""
        try:
            response = self.session.get(f"{self.base_url}/api/jobs/{job_id}")
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise Exception(f"Failed to fetch job {job_id}: {e}")
    
    def get_master_resume(self) -> Optional[Dict]:
        """Fetch the master resume."""
        try:
            response = self.session.get(f"{self.base_url}/api/resumes")
            response.raise_for_status()
            data = response.json()
            
            if data.get("success"):
                resumes = data.get("resumes", [])
                # Find the master resume
                for resume in resumes:
                    if resume.get("isMaster"):
                        return resume
            
            return None
        except requests.RequestException as e:
            raise Exception(f"Failed to fetch master resume: {e}")
    
    def generate_latex_resume(self, job_id: str) -> Dict:
        """
        Call the ResumeForge API endpoint to generate a tailored LaTeX resume.
        
        Returns:
            Dict with 'latexSource' and 'pdfBase64' keys
        """
        try:
            response = self.session.post(
                f"{self.base_url}/api/resumeforge",
                json={"jobId": job_id}
            )
            response.raise_for_status()
            data = response.json()
            
            if not data.get("success"):
                raise Exception(data.get("error", "Unknown error"))
            
            return {
                "latexSource": data.get("latexSource"),
                "pdfBase64": data.get("pdfBase64"),
                "jobTitle": data.get("jobTitle"),
                "company": data.get("company")
            }
        except requests.RequestException as e:
            raise Exception(f"Failed to generate LaTeX resume: {e}")
