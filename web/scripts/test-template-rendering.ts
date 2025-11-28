import { generateLatexSource } from '../lib/latex-compiler.js';

// Sample resume data to test template rendering
const testData = {
    name: "Test User",
    email: "test@example.com",
    phone: "123-456-7890",
    linkedin: "https://linkedin.com/in/test",
    github: "https://github.com/test",

    education: [
        {
            institution: "Test University",
            location: "Test City, ST",
            degree: "B.S. in Computer Science",
            date: "May 2024"
        }
    ],

    skills: [
        {
            category: "Languages",
            items: "JavaScript, TypeScript, Python"
        }
    ],

    experience: [
        {
            company: "Test Company",
            location: "New York, NY",
            title: "Software Engineer Intern",
            date: "05/2024 - 08/2024",
            bullets: [
                "Built features using \\textbf{React} and \\textbf{TypeScript}",
                "Improved performance by \\textbf{40\\%}"
            ]
        }
    ],

    projects: [
        {
            name: "Test Project",
            tech: "Next.js, TypeScript",
            date: "2024",
            bullets: [
                "Developed a web application",
                "Deployed to production"
            ]
        }
    ]
};

console.log("Testing LaTeX generation...\n");
const latex = generateLatexSource(testData);

// Check if bullets are present
if (latex.includes("\\resumeItem{Built features")) {
    console.log("✅ Experience bullets are present!");
} else {
    console.log("❌ Experience bullets are MISSING!");
}

if (latex.includes("\\resumeItem{Developed a web application}")) {
    console.log("✅ Project bullets are present!");
} else {
    console.log("❌ Project bullets are MISSING!");
}

console.log("\n--- Experience Section Preview ---");
const expSection = latex.match(/%-----------EXPERIENCE-----------[\s\S]*?(?=%-----------PROJECTS-----------)/);
if (expSection) {
    console.log(expSection[0].substring(0, 500));
}

console.log("\n--- Projects Section Preview ---");
const projSection = latex.match(/%-----------PROJECTS-----------[\s\S]*?(?=\\end{document})/);
if (projSection) {
    console.log(projSection[0].substring(0, 500));
}
