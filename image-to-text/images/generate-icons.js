// This script generates PNG icons for the extension
// Run this in a browser environment to generate the icons

function generateIcon(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#4285F4'; // Google Blue
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.125); // Rounded corners
  ctx.fill();
  
  // "OCR" text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('OCR', size / 2, size / 2);
  
  // Image to text icon
  const lineWidth = size * 0.075;
  ctx.strokeStyle = 'white';
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Lines representing text
  const margin = size * 0.2;
  const lineY1 = size - margin - lineWidth/2;
  const lineY2 = lineY1 - lineWidth*2;
  
  // Short line
  ctx.beginPath();
  ctx.moveTo(margin, lineY1);
  ctx.lineTo(size * 0.4, lineY1);
  ctx.stroke();
  
  // Medium line
  ctx.beginPath();
  ctx.moveTo(margin, lineY2);
  ctx.lineTo(size * 0.6, lineY2);
  ctx.stroke();
  
  return canvas.toDataURL('image/png');
}

// Usage:
// 1. Open this in a browser context
// 2. Run in console:
//    const icon16 = generateIcon(16);
//    const icon48 = generateIcon(48);
//    const icon128 = generateIcon(128);
// 3. You can then copy the data URLs and save them as PNG files