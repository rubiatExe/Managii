// Background script for Managify
console.log("Managify background script loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveJob") {
    console.log("Received job data:", request.data);

    // Add timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    fetch('http://localhost:3000/api/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request.data),
      signal: controller.signal
    })
      .then(response => {
        clearTimeout(timeoutId);
        console.log('Response status:', response.status);

        if (response.status === 409) {
          // Duplicate job
          return response.json().then(data => {
            throw new Error('Job already saved');
          });
        }

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        return response.json();
      })
      .then(data => {
        console.log('Success:', data);
        sendResponse({ success: true, data: data });
      })
      .catch((error) => {
        console.error('Error:', error);

        let errorMessage = error.message || error.toString();
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout - check internet connection';
        } else if (errorMessage.includes('fetch')) {
          errorMessage = 'Cannot connect to Managify server';
        }

        sendResponse({ success: false, error: errorMessage });
      });

    return true; // Keep the message channel open for async response
  }
});
