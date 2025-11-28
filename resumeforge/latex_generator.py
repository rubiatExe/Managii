"""LaTeX resume template and generation."""

from jinja2 import Template
from typing import Dict, List


# Jake Gutierrez resume template - User's preferred format
RESUME_TEMPLATE = r"""
%-------------------------
% Resume in Latex
% Author : Jake Gutierrez
% Based off of: https://github.com/sb2nov/resume
% License : MIT
%------------------------

\documentclass[letterpaper,11pt]{article}

\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\input{glyphtounicode}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

% Adjust margins - AGGRESSIVE OPTIMIZATION FOR 11PT FIT
\addtolength{\oddsidemargin}{-0.7in}
\addtolength{\evensidemargin}{-0.7in}
\addtolength{\textwidth}{1.4in}
\addtolength{\topmargin}{-.7in}
\addtolength{\textheight}{1.4in}

\urlstyle{same}

\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

% Sections formatting
\titleformat{\section}{
  \vspace{-10pt}\scshape\raggedright\large
}{}{0em}{}[\color{black}\titlerule \vspace{-6pt}]

% Ensure that generate pdf is machine readable/ATS parsable
\pdfgentounicode=1

%-------------------------
% Custom commands
\newcommand{\resumeItem}[1]{
  \item\small{
    {#1 \vspace{-2pt}}
  }
}

\newcommand{\resumeSubheading}[4]{
  \vspace{-1pt}\item
    \begin{tabular*}{0.97\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & #2 \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubSubheading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \textit{\small#1} & \textit{\small #2} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{0.97\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & #2 \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubItem}[1]{\resumeItem{#1}\vspace{-4pt}}

\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}

\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.15in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}[itemsep=-2pt, leftmargin=0.15in]}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-6pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\begin{document}

%----------HEADING----------
\begin{center}
    \textbf{\Huge \scshape {{ name }}} \\ \vspace{2pt}
    \small {% if phone %}{{ phone }}{% endif %}{% if email %} $|$ \href{mailto:{{ email }}}{\underline{ {{- email -}} }}{% endif %}{% if linkedin %} $|$ \href{ {{- linkedin -}} }{\underline{LinkedIn}}{% endif %}{% if github %} $|$ \href{ {{- github -}} }{\underline{GitHub}}{% endif %}
\end{center}

{% if education %}
%-----------EDUCATION-----------
\section{Education}
  \resumeSubHeadingListStart
{% for edu in education %}
    \resumeSubheading
      { {{- edu.institution -}} }{ {{- edu.location -}} }
      { {{- edu.degree -}} }{ {{- edu.date -}} }
{% endfor %}
  \resumeSubHeadingListEnd
{% endif %}

{% if skills %}
%-----------SKILLS-----------
\section{Technical Skills}
 \begin{itemize}[leftmargin=0.15in, label={}]
    \small{\item{
{% for skill in skills %}
     \textbf{ {{- skill.category -}} }{: {{ skill.items }}}{% if not loop.last %} \\{% endif %}
{% endfor %}
    }}
 \end{itemize}
{% endif %}

{% if experience %}
%-----------EXPERIENCE-----------
\section{Experience}
  \resumeSubHeadingListStart
{% for exp in experience %}
    \resumeSubheading
      { {{- exp.company -}} }{ {{- exp.location -}} }
      { {{- exp.title -}} }{ {{- exp.date -}} }
      \resumeItemListStart
{% for bullet in exp.bullets %}
        \resumeItem{ {{- bullet -}} }
{% endfor %}
      \resumeItemListEnd
{% endfor %}
  \resumeSubHeadingListEnd
{% endif %}

{% if projects %}
%-----------PROJECTS-----------
\section{Projects}
    \resumeSubHeadingListStart
{% for project in projects %}
      \resumeProjectHeading
          {\textbf{ {{- project.name -}} }{% if project.tech %} $|$ \emph{ {{- project.tech -}} }{% endif %}}{{% if project.date %}{{ project.date }}{% endif %}}
          \resumeItemListStart
{% for bullet in project.bullets %}
            \resumeItem{ {{- bullet -}} }
{% endfor %}
          \resumeItemListEnd
{% endfor %}
    \resumeSubHeadingListEnd
{% endif %}

\end{document}
""".strip()


class LatexGenerator:
    """Generate LaTeX resumes from structured data."""
    
    @staticmethod
    def generate(resume_data: Dict) -> str:
        """
        Generate LaTeX source from resume data.
        
        Args:
            resume_data: Dictionary containing resume sections (name, education, experience, etc.)
        
        Returns:
            LaTeX source code as string
        """
        template = Template(RESUME_TEMPLATE)
        return template.render(**resume_data)
    
    @staticmethod
    def escape_latex(text: str) -> str:
        """Escape special LaTeX characters in text."""
        replacements = {
            '&': r'\&',
            '%': r'\%',
            '$': r'\$',
            '#': r'\#',
            '_': r'\_',
            '{': r'\{',
            '}': r'\}',
            '~': r'\textasciitilde{}',
            '^': r'\^{}',
            '\\': r'\textbackslash{}',
        }
        
        for old, new in replacements.items():
            text = text.replace(old, new)
        
        return text
    
    @staticmethod
    def clean_resume_data(data: Dict) -> Dict:
        """Clean and escape LaTeX special characters in resume data."""
        if isinstance(data, dict):
            return {k: LatexGenerator.clean_resume_data(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [LatexGenerator.clean_resume_data(item) for item in data]
        elif isinstance(data, str):
            return LatexGenerator.escape_latex(data)
        else:
            return data
