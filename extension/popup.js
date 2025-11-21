document.getElementById('save-btn').addEventListener('click', () => {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = "Scraping...";

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "scrape" }, (response) => {
            if (chrome.runtime.lastError) {
                statusDiv.textContent = "Error: " + chrome.runtime.lastError.message;
                return;
            }

            if (response) {
                statusDiv.textContent = "Saving to Managify...";
                // Send to background script to handle API call
                chrome.runtime.sendMessage({ action: "saveJob", data: response }, (bgResponse) => {
                    if (chrome.runtime.lastError) {
                        statusDiv.textContent = "Error: Extension needs reload. Go to chrome://extensions and click the reload button.";
                        console.error(chrome.runtime.lastError);
                        return;
                    }

                    if (bgResponse && bgResponse.success) {
                        statusDiv.textContent = "Saved successfully!";
                    } else {
                        statusDiv.textContent = "Failed to save: " + (bgResponse ? bgResponse.error : "Unknown error");
                    }
                });
            } else {
                statusDiv.textContent = "Could not scrape page.";
            }
        });
    });
});
