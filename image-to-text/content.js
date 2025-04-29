// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "convertToText") {
    processImage(message.imageUrl);
  }
});

// Process the image using Tesseract.js for OCR
function processImage(imageUrl) {
  // Create overlay to show loading and results
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
  overlay.style.zIndex = '9999';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.color = 'white';
  overlay.style.fontFamily = 'Arial, sans-serif';
  overlay.style.padding = '20px';
  
  const header = document.createElement('div');
  header.style.width = '100%';
  header.style.display = 'flex';
  header.style.justifyContent = 'flex-end';
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.color = 'white';
  closeBtn.style.fontSize = '24px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.onclick = () => document.body.removeChild(overlay);
  
  header.appendChild(closeBtn);
  
  const content = document.createElement('div');
  content.style.width = '80%';
  content.style.maxWidth = '800px';
  content.style.maxHeight = '80%';
  content.style.overflowY = 'auto';
  content.style.backgroundColor = '#222';
  content.style.padding = '20px';
  content.style.borderRadius = '5px';
  content.style.marginTop = '20px';
  
  const title = document.createElement('h2');
  title.textContent = 'Image to Text Conversion';
  title.style.marginBottom = '20px';
  
  const status = document.createElement('p');
  status.textContent = 'Loading Tesseract.js...';
  
  const resultContainer = document.createElement('div');
  resultContainer.style.whiteSpace = 'pre-wrap';
  resultContainer.style.backgroundColor = '#333';
  resultContainer.style.padding = '15px';
  resultContainer.style.borderRadius = '5px';
  resultContainer.style.marginTop = '15px';
  resultContainer.style.display = 'none';
  
  const copyButton = document.createElement('button');
  copyButton.textContent = 'Copy Text';
  copyButton.style.marginTop = '15px';
  copyButton.style.padding = '8px 16px';
  copyButton.style.backgroundColor = '#4CAF50';
  copyButton.style.color = 'white';
  copyButton.style.border = 'none';
  copyButton.style.borderRadius = '4px';
  copyButton.style.cursor = 'pointer';
  copyButton.style.display = 'none';
  
  content.appendChild(title);
  content.appendChild(status);
  content.appendChild(resultContainer);
  content.appendChild(copyButton);
  
  overlay.appendChild(header);
  overlay.appendChild(content);
  
  document.body.appendChild(overlay);
  
  // Load Tesseract.js script dynamically
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.5/dist/tesseract.min.js';
  script.onload = () => {
    status.textContent = 'Processing image...';
    
    // Process image with Tesseract
    window.Tesseract.recognize(
      imageUrl,
      'eng',
      { 
        logger: m => {
          if (m.status === 'recognizing text') {
            status.textContent = `Processing image: ${Math.floor(m.progress * 100)}%`;
          }
        }
      }
    ).then(({ data: { text } }) => {
      status.textContent = 'Text extracted successfully:';
      resultContainer.style.display = 'block';
      resultContainer.textContent = text;
      copyButton.style.display = 'inline-block';
      
      copyButton.onclick = () => {
        navigator.clipboard.writeText(text)
          .then(() => {
            const originalText = copyButton.textContent;
            copyButton.textContent = 'Copied!';
            setTimeout(() => {
              copyButton.textContent = originalText;
            }, 2000);
          })
          .catch(err => {
            console.error('Failed to copy text: ', err);
          });
      };
    }).catch(error => {
      status.textContent = 'Error processing image';
      resultContainer.style.display = 'block';
      resultContainer.textContent = `An error occurred: ${error.message}`;
    });
  };
  
  script.onerror = () => {
    status.textContent = 'Failed to load Tesseract.js library';
  };
  
  document.body.appendChild(script);
}