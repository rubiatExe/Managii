// Content script for Managify
console.log("Managify content script loaded.");

async function getJobDetails() {
    // Ensure the page is fully loaded and lazy content has a chance to render
    await new Promise(resolve => setTimeout(resolve, 800)); // wait 800ms

    const title = document.title;
    const url = window.location.href;
    let description = "";
    let company = "Unknown";

    // Company extraction (unchanged)
    const linkedinCompany = document.querySelector('.job-details-jobs-unified-top-card__company-name');
    if (linkedinCompany) company = linkedinCompany.innerText.trim();
    const indeedCompany = document.querySelector('[data-company-name="true"]') ||
        document.querySelector('.jobsearch-InlineCompanyRating-companyHeader');
    if (indeedCompany) company = indeedCompany.innerText.trim().split('\n')[0];
    const greenhouseCompany = document.querySelector('.company-name') ||
        document.querySelector('[class*="company"]');
    if (greenhouseCompany && company === "Unknown") company = greenhouseCompany.innerText.trim();
    const ogSiteName = document.querySelector('meta[property="og:site_name"]');
    if (ogSiteName && company === "Unknown") company = ogSiteName.content;

    // Description extraction (enhanced)
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && metaDesc.content.length > 100) description = metaDesc.content;

    if (description.length < 100) {
        const descContainer =
            document.querySelector('.jobs-description__content') ||
            document.querySelector('.jobs-description') ||
            document.querySelector('.job-view-layout') ||
            document.querySelector('#jobDescriptionText') ||
            document.querySelector('.jobsearch-jobDescriptionText') ||
            document.querySelector('#content .content') ||
            document.querySelector('.job-post') ||
            document.querySelector('#app_body') ||
            document.querySelector('.posting-description') ||
            document.querySelector('.posting-requirements') ||
            document.querySelector('[data-automation-id="jobPostingDescription"]') ||
            document.querySelector('.job-description') ||
            document.querySelector('[class*="description"]') ||
            document.querySelector('.career-job-description') ||
            document.querySelector('.job-description-content') ||
            document.querySelector('.BambooHR-ATS-Description') ||
            document.querySelector('[class*="job-description"]') ||
            document.querySelector('[id*="job-description"]') ||
            document.querySelector('[id*="description"]') ||
            document.querySelector('.description') ||
            document.querySelector('article') ||
            document.querySelector('main') ||
            document.querySelector('[role="main"]');
        if (descContainer) {
            description = descContainer.textContent || descContainer.innerText || '';
            description = description.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
            if (description.length > 8000) description = description.substring(0, 8000) + '...';
        }
    }

    // If still too short, perform a second pass after a short delay
    if (description.length < 200) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const bodyText = document.body.innerText || document.body.textContent || '';
        const sections = bodyText.split(/\n{2,}/);
        const jobSections = sections.filter(section => {
            const lower = section.toLowerCase();
            return section.length > 100 && (
                lower.includes('responsibilit') || lower.includes('qualificat') || lower.includes('experience') ||
                lower.includes('requirement') || lower.includes('skills') || lower.includes('about the role') || lower.includes('what you')
            );
        });
        if (jobSections.length > 0) {
            description = jobSections.join('\n\n').substring(0, 8000);
        } else {
            const paragraphs = Array.from(document.querySelectorAll('p, li')).map(el => el.textContent.trim());
            const longParagraphs = paragraphs.filter(p => p.length > 50).slice(0, 20);
            description = longParagraphs.join('\n').substring(0, 8000);
        }
    }

    return {
        title,
        url,
        description,
        company,
        dateApplied: new Date().toISOString()
    };
}

// Create and inject floating button
function createFloatingButton() {
    // Check if button already exists
    if (document.getElementById('managify-floating-btn')) return;

    const button = document.createElement('button');
    button.id = 'managify-floating-btn';
    button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 13l4 4L19 7"></path>
        </svg>
        <span>Save to Managify</span>
    `;

    button.addEventListener('click', async () => {
        button.classList.add('saving');
        button.innerHTML = '<span>Saving...</span>';

        try {
            const jobData = await getJobDetails();

            // Send to background script
            const response = await chrome.runtime.sendMessage({
                action: "saveJob",
                data: jobData
            });

            if (response && response.success) {
                button.classList.remove('saving');
                button.classList.add('success');
                button.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Saved!</span>
                `;

                setTimeout(() => {
                    button.classList.remove('success');
                    button.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>Save to Managify</span>
                    `;
                }, 2000);
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            console.error('Error saving job:', error);
            button.classList.remove('saving');
            button.classList.add('error');
            button.innerHTML = '<span>Error - Try Again</span>';

            setTimeout(() => {
                button.classList.remove('error');
                button.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Save to Managify</span>
                `;
            }, 2000);
        }
    });

    document.body.appendChild(button);
}

// Initialize floating button when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatingButton);
} else {
    createFloatingButton();
}

// Listen for messages from the popup (keep for backward compatibility)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrape") {
        const data = getJobDetails();
        sendResponse(data);
        return true; // Keep message channel open
    }
});
