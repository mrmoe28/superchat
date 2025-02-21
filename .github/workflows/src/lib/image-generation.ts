import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';

export async function generateImage(htmlContent: string): Promise<string> {
  try {
    // Create canvas
    const canvas = createCanvas(1200, 800);
    const ctx = canvas.getContext('2d');

    // Set background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 1200, 800);

    // Add padding
    ctx.translate(20, 20);

    // Set text styles
    ctx.font = '16px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#000000';

    // Remove HTML tags and render text
    const plainText = htmlContent.replace(/<[^>]+>/g, '');
    
    // Word wrap text
    const words = plainText.split(' ');
    let line = '';
    let y = 30;
    const lineHeight = 24;
    const maxWidth = 1160; // canvas width - 2 * padding

    for (let word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth) {
        ctx.fillText(line, 0, y);
        line = word + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 0, y);

    // Convert to data URL
    return canvas.toDataURL('image/jpeg', 0.95);
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('Failed to generate image from HTML');
  }
} 