# SEO AutoFix GBP Inspector Chrome Extension

A Chrome extension that extracts Google Business Profile (GBP) categories and provides quick completeness scores from Google Maps listings.

## Features

### Module 1: GBP Category Extractor
- One-click category extraction from any Google Maps listing
- Shows primary and secondary categories
- Works on Google Maps and Local Finder
- Free unlimited use
- Export categories to CSV

### Module 2: Quick GBP Score
- Instant completeness check for any GBP listing
- Shows missing: hours, photos, description, website
- Simple 0-100 score
- One-click export to full web app audit

## Installation

### Development Mode
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `gbp-inspector-extension` folder

### Production
- Package as a .zip file
- Upload to Chrome Web Store

## Usage

1. Navigate to a Google Maps business listing
2. Click the extension icon
3. View extracted categories and GBP score
4. Export to CSV or open full audit in web app

## Files

- `manifest.json` - Extension configuration
- `popup.html` - Popup UI
- `popup.js` - Popup logic
- `content.js` - Content script for data extraction
- `background.js` - Background service worker

## API Integration

The extension can connect to the existing `/api/gbp/scrape` endpoint for enhanced data extraction.

## Testing

To test the extension:
1. Load in developer mode
2. Navigate to a Google Maps business listing
3. Open the extension popup
4. Verify data extraction works correctly
