// Content script for Managify
console.log("Managify content script loaded.");

// Load filter utilities (injected by manifest)
// filters.js is loaded before this script, so we can use its functions

async function getJobDetails() {
    // Ensure the page is fully loaded and lazy content has a chance to render
    await new Promise(resolve => setTimeout(resolve, 800)); // wait 800ms

    let title = document.title;
    const url = window.location.href;
    let description = "";
    let company = "Unknown";
    let location = "N/A";

    // Workday-specific extraction
    if (url.includes('myworkdayjobs.com') || url.includes('workday.com')) {
        // Workday company name
        const workdayCompany = document.querySelector('[data-automation-id="jobPostingCompany"]') ||
            document.querySelector('h1.company-name') ||
            document.querySelector('[class*="company"]');
        if (workdayCompany?.innerText) {
            company = workdayCompany.innerText.trim();
        } else {
            // Extract from URL (e.g., nike.wd1.myworkdayjobs.com -> Nike)
            const urlMatch = url.match(/\/\/([^.]+)\./);
            if (urlMatch && urlMatch[1]) {
                company = urlMatch[1].charAt(0).toUpperCase() + urlMatch[1].slice(1);
            }
        }

        // Workday job title - try multiple selectors
        const workdayTitle =
            document.querySelector('[data-automation-id="jobPostingHeader"]') ||
            document.querySelector('h1[data-automation-id]') ||
            document.querySelector('h2[data-automation-id="jobPostingTitle"]') ||
            document.querySelector('h1.heading') ||
            document.querySelector('h2.title') ||
            document.querySelector('[class*="job-title"]') ||
            document.querySelector('h1') ||  // Last resort: first h1
            document.querySelector('h2');

        if (workdayTitle?.innerText) {
            title = workdayTitle.innerText.trim();
            // Sometimes includes extra text, try to clean it
            if (title.includes(' - ')) {
                // If title has " - ", take everything (e.g., "Software Engineer I - Innovation")
                title = title.trim();
            }
        }

        // If we got something generic like "Career" or "Jobs", fall back to document title
        if (!workdayTitle || title === 'Career' || title === 'Jobs' || title === 'Careers' || title.length < 5) {
            // Extract from document title
            const docTitle = document.title;
            if (docTitle.includes(' - ')) {
                const parts = docTitle.split(' - ');
                // Usually format is "Job Title - Company" or "Company - Job Title"
                if (parts.length >= 2) {
                    // Take the first part that's not the company name
                    title = parts.find(part => part.trim() !== company) || parts[0];
                    title = title.trim();
                }
            }
        }

        // Workday location - try multiple approaches
        // Method 1: Workday-specific data attributes
        let workdayLocation = document.querySelector('[data-automation-id="jobPostingLocation"]') ||
            document.querySelector('[data-automation-id="locations"]');

        if (workdayLocation?.innerText) {
            location = workdayLocation.innerText.trim();
        }

        // Method 2: Try to find in structured data or meta tags
        if (location === "N/A") {
            const metaLocation = document.querySelector('meta[property="og:location"]') ||
                document.querySelector('meta[name="location"]');
            if (metaLocation?.content) {
                location = metaLocation.content;
            }
        }

        // Method 3: Look for location in job details container
        if (location === "N/A") {
            const jobDetails = document.querySelector('[class*="job-detail"]') ||
                document.querySelector('[class*="posting-detail"]');
            if (jobDetails) {
                const locationSpan = jobDetails.querySelector('[class*="location"]') ||
                    jobDetails.querySelector('dd');  // Often in definition lists
                if (locationSpan?.innerText) {
                    location = locationSpan.innerText.trim();
                }
            }
        }

        // Method 4: Extract from URL path (e.g., /job/Beaverton-Oregon/)
        if (location === "N/A") {
            const urlParts = url.split('/');
            const jobIndex = urlParts.findIndex(part => part === 'job');
            if (jobIndex >= 0 && urlParts[jobIndex + 1]) {
                const locationPart = urlParts[jobIndex + 1];
                if (locationPart && locationPart.includes('-') && !locationPart.startsWith('R-')) {
                    // Convert "Beaverton-Oregon" to "Beaverton, Oregon"
                    location = locationPart.split('-').join(', ');
                }
            }
        }
    }

    // LinkedIn extraction
    const linkedinCompany = document.querySelector('.job-details-jobs-unified-top-card__company-name');
    if (linkedinCompany?.innerText && company === "Unknown") company = linkedinCompany.innerText.trim();

    const linkedinTitle = document.querySelector('.job-details-jobs-unified-top-card__job-title');
    if (linkedinTitle?.innerText) title = linkedinTitle.innerText.trim();

    // Indeed extraction
    const indeedCompany = document.querySelector('[data-company-name="true"]') ||
        document.querySelector('.jobsearch-InlineCompanyRating-companyHeader');
    if (indeedCompany?.innerText && company === "Unknown") company = indeedCompany.innerText.trim().split('\n')[0];

    const indeedTitle = document.querySelector('[class*="jobsearch-JobInfoHeader-title"]');
    if (indeedTitle?.innerText) title = indeedTitle.innerText.trim();

    // Greenhouse extraction
    const greenhouseCompany = document.querySelector('.company-name') ||
        document.querySelector('[class*="company"]');
    if (greenhouseCompany?.innerText && company === "Unknown") company = greenhouseCompany.innerText.trim();

    const greenhouseTitle = document.querySelector('.app-title');
    if (greenhouseTitle?.innerText) title = greenhouseTitle.innerText.trim();

    // Lever extraction
    const leverTitle = document.querySelector('.posting-headline h2');
    if (leverTitle?.innerText) title = leverTitle.innerText.trim();

    // Try to extract from document title if still using default
    if (!leverTitle && !greenhouseTitle && !indeedTitle && !linkedinTitle) {
        const titleParts = document.title.split(' - ');
        if (titleParts.length >= 2) {
            if (company === "Unknown") company = titleParts[0].trim();
            title = titleParts[1].trim();
        }
    }

    // Fallback for og:site_name
    const ogSiteName = document.querySelector('meta[property="og:site_name"]');
    if (ogSiteName?.content && company === "Unknown") company = ogSiteName.content;

    // Location extraction
    const workdayLocationFinal = document.querySelector('[data-automation-id="jobPostingLocation"]');
    if (workdayLocationFinal?.innerText && location === "N/A") location = workdayLocationFinal.innerText.trim();

    const greenhouseLocation = document.querySelector('.location');
    if (greenhouseLocation?.innerText && location === "N/A") location = greenhouseLocation.innerText.trim();

    const leverLocation = document.querySelector('.posting-categories');
    if (leverLocation && location === "N/A") {
        const locationDiv = leverLocation.querySelector('.location');
        if (locationDiv?.innerText) location = locationDiv.innerText.trim();
    }

    const linkedinLocation = document.querySelector('.job-details-jobs-unified-top-card__primary-description-container');
    if (linkedinLocation && location === "N/A") {
        const locationSpan = linkedinLocation.querySelector('span');
        if (locationSpan?.innerText) location = locationSpan.innerText.trim();
    }

    const indeedLocation = document.querySelector('[data-testid="jobsearch-JobInfoHeader-companyLocation"]');
    if (indeedLocation?.innerText && location === "N/A") location = indeedLocation.innerText.trim();

    // Description extraction (enhanced with Workday support)
    let descContainer = null;

    // Try Workday-specific selectors first
    if (url.includes('myworkdayjobs.com') || url.includes('workday.com')) {
        descContainer = document.querySelector('[data-automation-id="jobPostingDescription"]');
    }

    // Fall back to other selectors if not found
    if (!descContainer) {
        descContainer =
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
    }

    if (descContainer) {
        // Use innerHTML to preserve structure, then convert to formatted text
        let html = descContainer.innerHTML || descContainer.textContent || '';

        // Convert HTML to readable text with formatting
        description = html
            // Convert list items to bullet points
            .replace(/<li[^>]*>/gi, '\n• ')
            .replace(/<\/li>/gi, '')
            // Convert paragraphs and divs to double newlines
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<p[^>]*>/gi, '')
            .replace(/<\/div>/gi, '\n')
            .replace(/<div[^>]*>/gi, '')
            // Convert breaks to newlines
            .replace(/<br\s*\/?>/gi, '\n')
            // Remove all other HTML tags
            .replace(/<[^>]+>/g, '')
            // Decode HTML entities
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            // Clean up whitespace but preserve intentional breaks
            .replace(/[ \t]+/g, ' ')  // Collapse spaces/tabs on same line
            .replace(/\n[ \t]+/g, '\n')  // Remove leading spaces after newlines
            .replace(/\n{4,}/g, '\n\n\n')  // Max 3 newlines
            .trim();

        // Remove common headers (case-insensitive, at start)
        const headersToRemove = [
            /^Job Description\s*/i,
            /^Apply for this job\s*/i,
            /^Apply Now\s*/i,
            /^Share this job\s*/i,
            /^Save this job\s*/i,
            /^Report this job\s*/i
        ];

        for (const headerRegex of headersToRemove) {
            description = description.replace(headerRegex, '');
        }

        // Remove accommodation footer (common in Workday)
        const accommodationIndex = description.indexOf('We offer a number of accommodations');
        if (accommodationIndex > 0) {
            description = description.substring(0, accommodationIndex).trim();
        }

        // Final cleanup
        description = description.trim();

        if (description.length > 8000) description = description.substring(0, 8000) + '...';
    }

    // If still too short, try meta description
    if (description.length < 100) {
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc?.content && metaDesc.content.length > 100) {
            description = metaDesc.content;
        }
    }

    // If still too short, perform a second pass
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

    // Analyze job with filters
    const analysis = typeof analyzeJob !== 'undefined'
        ? analyzeJob({ title, description, location })
        : { category: null, isRelevant: true, inUSA: true, categoryInfo: { name: 'Other', color: '#6b7280' } };

    return {
        title,
        url,
        description,
        company,
        location,
        category: analysis.category,
        isRelevant: analysis.isRelevant,
        dateApplied: new Date().toISOString()
    };
}

// Create and inject floating button
function createFloatingButton() {
    // Check if button already exists
    if (document.getElementById('managify-floating-btn')) return;

    const button = document.createElement('button');
    button.id = 'managify-floating-btn';

    // Badge container for category
    const badge = document.createElement('span');
    badge.id = 'managify-category-badge';
    badge.style.cssText = 'display: none; position: absolute; top: -8px; right: -8px; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold; color: white; background: #6b7280;';

    button.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 13l4 4L19 7"></path>
        </svg>
        <span>Save to Managify</span>
    `;
    button.style.position = 'relative';
    button.appendChild(badge);

    // Update badge when page loads
    (async () => {
        try {
            const jobData = await getJobDetails();
            if (jobData.category && jobData.isRelevant) {
                const analysis = typeof analyzeJob !== 'undefined'
                    ? analyzeJob(jobData)
                    : { categoryInfo: { name: 'Other', color: '#6b7280' } };
                badge.textContent = analysis.categoryInfo.name;
                badge.style.background = analysis.categoryInfo.color;
                badge.style.display = 'block';
            }
        } catch (e) {
            console.error('Error analyzing job:', e);
        }
    })();

    button.addEventListener('click', async () => {
        button.classList.add('saving');
        const savingHTML = '<span>Saving...</span>';
        const originalBadge = badge.cloneNode(true);
        button.innerHTML = savingHTML;

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
                button.appendChild(originalBadge);

                setTimeout(() => {
                    button.classList.remove('success');
                    button.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>Save to Managify</span>
                    `;
                    button.appendChild(originalBadge);
                }, 2000);
            } else {
                // Get the actual error message from background script
                const errorMsg = response?.error || 'No response from background script';
                console.log('Background script error:', errorMsg);
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error('Error saving job:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                runtime: chrome.runtime?.lastError
            });

            button.classList.remove('saving');
            button.classList.add('error');

            // Show specific error message
            let errorMsg = error.message || 'Unknown error';

            if (errorMsg.includes('Extension context invalidated')) {
                errorMsg = "Please refresh page";
            }

            button.innerHTML = `<span style="font-size: 11px;">${errorMsg.substring(0, 50)}</span>`;
            button.appendChild(originalBadge);

            setTimeout(() => {
                button.classList.remove('error');
                button.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Save to Managify</span>
                `;
                button.appendChild(originalBadge);
            }, 3000);
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
