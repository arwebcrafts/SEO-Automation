# GBP Inspector Chrome Extension - Installation Guide

## Prerequisites
- Google Chrome browser (latest version)
- For development: Chrome Developer Mode enabled

## Installation Steps

### Development Mode (for testing)

1. **Prepare Icons**
   - Convert SVG icons to PNG format using an online converter or ImageMagick:
     ```
     convert icons/icon16.svg icons/icon16.png
     convert icons/icon48.svg icons/icon48.png
     convert icons/icon128.svg icons/icon128.png
     ```
   - Or use Figma/Illustrator to export as PNG

2. **Load Extension in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Toggle "Developer mode" in the top right corner
   - Click "Load unpacked"
   - Select the `gbp-inspector-extension` folder

3. **Verify Installation**
   - You should see "SEO AutoFix GBP Inspector" in your extensions list
   - The extension icon should appear in your browser toolbar

## Usage

### Basic Usage

1. **Navigate to Google Maps**
   - Go to [Google Maps](https://www.google.com/maps)
   - Search for a business or click on a business listing

2. **Open the Extension**
   - Click the extension icon in your browser toolbar
   - The popup will appear with extracted data

3. **View Extracted Data**
   - Business name and detection status
   - GBP completeness score (0-100)
   - Primary and secondary categories
   - Business details (address, phone, website, rating)
   - Checklist showing what's complete/missing

4. **Export Data**
   - Click "Export to CSV" to download business data
   - Click "Open Full Audit in Web App" to open detailed audit

### Features

#### Module 1: Category Extractor
- One-click extraction from any Google Maps listing
- Shows primary and secondary categories
- Free unlimited use
- Export to CSV

#### Module 2: Quick GBP Score
- Instant completeness check
- Shows missing elements
- Simple 0-100 score
- Checklist of all GBP elements

## Testing

### Manual Testing

1. Navigate to a Google Maps business listing
2. Click the extension icon
3. Verify:
   - Business name is extracted correctly
   - Categories are shown
   - GBP score is calculated
   - All business details are displayed
   - CSV export works
   - "Open Full Audit" button opens your web app

### Test URLs

Try these business listings for testing:
- https://www.google.com/maps/place/Tandoori+Restaurant+New+City+Wah
- Any local business in your area

## Troubleshooting

### Extension not loading
- Ensure Developer mode is enabled
- Check for syntax errors in JavaScript files
- Verify manifest.json is valid JSON

### Data not extracting
- Ensure you're on a business listing page (not search results)
- Check browser console for errors
- Refresh the page and try again

### Icons not showing
- Convert SVG files to PNG format
- Ensure icon filenames match manifest.json
- Icon sizes must be exactly 16x16, 48x48, 128x128

## Production Deployment

### Chrome Web Store

1. **Prepare for Upload**
   - Convert all SVG icons to PNG
   - Test thoroughly in development mode
   - Create screenshots for the store listing
   - Write store description and privacy policy

2. **Package Extension**
   - Zip the entire `gbp-inspector-extension` folder
   - Ensure all files are included

3. **Upload to Chrome Web Store**
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Create new item
   - Upload the zip file
   - Fill in store listing details
   - Pay $5 one-time developer fee
   - Submit for review

4. **Review Process**
   - Google typically reviews within 1-3 business days
   - Ensure your extension follows all Chrome Web Store policies
   - Be prepared to make changes if requested

## API Integration (Optional)

To connect to your existing `/api/gbp/scrape` endpoint:

1. Update `popup.js` to fetch from your API:
   ```javascript
   async function fetchFromAPI(url) {
     const response = await fetch('https://seo-try.vercel.app/api/gbp/scrape?url=' + encodeURIComponent(url));
     const data = await response.json();
     return data;
   }
   ```

2. Add your domain to `manifest.json` host_permissions:
   ```json
   "host_permissions": [
     "https://seo-try.vercel.app/*"
   ]
   ```

## Support

For issues or questions:
- Check browser console for errors
- Review Chrome extension documentation
- Contact development team

## License

This extension is part of the SEO AutoFix Pro project.
