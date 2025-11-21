// Background script for Managify
console.log("Managify background script loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveJob") {
    // TODO: Send data to Web App API
    console.log("Received job data:", request.data);

    fetch('http://localhost:3000/api/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request.data)
    })
      .then(response => {
        if (response.status === 409) {
          // Duplicate job
          return response.json().then(data => {
            throw new Error('Job already saved');
          });
        }
        return response.json();
      })
      .then(data => {
        console.log('Success:', data);
        sendResponse({ success: true, data: data });
      })
      .catch((error) => {
        console.error('Error:', error);
        sendResponse({ success: false, error: error.message || error.toString() });
      });

    return true; // Keep the message channel open for async response
  }
});
