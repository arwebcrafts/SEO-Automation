// Content Script - Runs on Google Maps pages
// Extracts GBP data from the DOM

console.log('GBP Inspector Content Script Loaded');

// Function to extract business data from Google Maps
function extractBusinessData() {
  const data = {
    detected: false,
    businessName: '',
    address: '',
    phone: '',
    website: '',
    rating: '',
    reviewCount: '',
    primaryCategory: '',
    additionalCategories: [],
    photoCount: '0',
    hasWorkHours: false,
    isClaimed: false,
    googleMapsUrl: window.location.href,
    placeId: '',
    cid: ''
  };
  
  try {
    const bodyText = document.body.textContent;
    
    // Extract business name - try multiple selectors
    const nameSelectors = [
      'h1[role="heading"][level="1"]',
      'h1[aria-label]',
      'h1.fontHeadlineLarge'
    ];
    
    for (const selector of nameSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent) {
        const text = el.textContent.trim();
        if (text.length > 3 && text.length < 100 && !text.includes('Google') && !text.includes('Maps')) {
          data.businessName = text;
          break;
        }
      }
    }
    
    // Fallback: Extract from page title
    if (!data.businessName && document.title) {
      const titleText = document.title.replace(' - Google Maps', '').trim();
      if (titleText.length > 3 && titleText.length < 100) {
        data.businessName = titleText;
      }
    }
    
    // Fallback: Extract from URL
    if (!data.businessName && window.location.href.includes('/place/')) {
      const urlMatch = window.location.href.match(/\/place\/([^/]+)/);
      if (urlMatch) {
        data.businessName = decodeURIComponent(urlMatch[1]).replace(/\+/g, ' ');
      }
    }
    
    // Extract address
    const addressSelectors = [
      '[data-item-id="address"]',
      '.Io6YTe',
      'button[aria-label*="address"]'
    ];
    
    for (const selector of addressSelectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent) {
        data.address = el.textContent.trim();
        break;
      }
    }
    
    // Extract phone
    const phoneSelectors = [
      '[data-item-id*="phone"]',
      '[data-item-id="oloc"]',
      'button[aria-label*="phone"]',
      'a[href^="tel:"]'
    ];
    
    for (const selector of phoneSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        if (el.textContent) {
          data.phone = el.textContent.trim();
        } else if (el.href && el.href.includes('tel:')) {
          data.phone = el.href.replace('tel:', '');
        }
        if (data.phone) break;
      }
    }
    
    // Extract website
    const websiteSelectors = [
      '[data-item-id="authority"]',
      'a[data-item-id="website"]'
    ];
    
    for (const selector of websiteSelectors) {
      const el = document.querySelector(selector);
      if (el && el.href) {
        data.website = el.href;
        break;
      }
    }
    
    // Extract rating - look for aria-label with stars
    const ratingEl = document.querySelector('[role="img"][aria-label*="stars"]');
    if (ratingEl) {
      const ariaLabel = ratingEl.getAttribute('aria-label') || '';
      const match = ariaLabel.match(/(\d\.\d)\s*stars/i);
      if (match) {
        data.rating = match[1];
      }
    }
    
    // Extract review count - look for pattern in body text
    const reviewMatch = bodyText.match(/(\d{1,3}(,\d{3})*)\s+reviews/i);
    if (reviewMatch) {
      data.reviewCount = reviewMatch[1].replace(/,/g, '');
    }
    
    // Extract photo count
    const photoMatch = bodyText.match(/(\d+)\s+photos/i);
    if (photoMatch) {
      data.photoCount = photoMatch[1];
    }
    
    // If still 0, try to count photo buttons
    if (data.photoCount === '0') {
      const photosSection = document.querySelector('[role="region"][aria-label*="photo" i], [role="region"][aria-label*="Photo" i]');
      if (photosSection) {
        const photoButtons = photosSection.querySelectorAll('button[aria-label*="Photo"], button[aria-label*="photo"]');
        if (photoButtons.length > 0) {
          data.photoCount = photoButtons.length.toString();
        }
      }
    }
    
    // Check if business hours are shown
    const timePatterns = [
      /opens?\s+\d{1,2}/i,
      /closes?\s+\d{1,2}/i,
      /\d{1,2}:\d{2}\s*(AM|PM)/i,
      /open\s+24\s+hours/i
    ];
    data.hasWorkHours = timePatterns.some(pattern => pattern.test(bodyText));
    
    // Extract categories - look for category button specifically
    const excludeText = ['Add a label', 'Suggest an edit', 'Edit', 'Copy', 'Share', 'Save', 'Directions', 'Nearby', 'Send to phone', 'Menu', 'Website', 'Phone', 'Address', 'Hours', 'Plus code', 'Your Maps history', 'Price', 'Rating', 'All filters', 'Back to top', 'Dine-in', 'Takeout', 'Delivery', 'No-contact delivery', 'Search this area', 'Recents', 'Get app', 'See photos', 'Overview', 'Reviews', 'About', 'Write a review', 'Sort', 'All', 'See more', 'Like', 'Learn more', 'Show slider', 'Hide slider', 'Transit', 'Traffic', 'Biking', 'Terrain', 'Street View', 'Wildfires', 'Air Quality', 'Travel time', 'Measure', 'Default', 'Satellite', 'Globe view', 'Labels', 'Global', 'Terms', 'Privacy', 'Thursdays', 'Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'review', 'reviews', 'More', 'Close', 'Open', 'AM', 'PM'];
    const categories = [];
    
    // Look for the category button specifically - it's usually near the top with aria-label containing "category"
    const categoryButtons = document.querySelectorAll('button[aria-label*="category"], button[role="button"][aria-label]');
    categoryButtons.forEach(el => {
      if (el.textContent) {
        const text = el.textContent.trim();
        // Very strict filtering for categories
        if (!categories.includes(text) && 
            !excludeText.some(exclude => text.toLowerCase().includes(exclude.toLowerCase())) && 
            text.length > 2 && 
            text.length < 30 &&
            text.split(' ').length <= 2 &&
            !text.includes(':') &&
            !text.includes('Rs') &&
            !text.includes('stars') &&
            !text.includes('review') &&
            !text.includes('filter') &&
            !text.includes('back') &&
            !text.includes('+') &&
            !text.match(/^\d/) &&
            !text.includes('day') &&
            !text.includes('ago') &&
            !text.includes('month') &&
            !text.includes('year')) {
          categories.push(text);
        }
      }
    });
    
    // If still no categories, try to find from the main heading area
    if (categories.length === 0) {
      // Look for text near the business name that might be a category
      const allText = document.body.textContent;
      const commonCategories = ['Restaurant', 'Cafe', 'Bar', 'Hotel', 'Shop', 'Store', 'Service', 'Bank', 'ATM', 'Gas Station', 'Pharmacy', 'Hospital', 'School', 'Church', 'Mosque', 'Temple', 'Gym', 'Salon', 'Spa', 'Dentist', 'Doctor', 'Lawyer', 'Accountant', 'Real Estate', 'Auto Repair', 'Car Wash', 'Laundry', 'Dry Cleaner', 'Bakery', 'Butcher', 'Grocery', 'Supermarket', 'Convenience Store', 'Fast Food', 'Pizza', 'Sushi', 'Chinese', 'Indian', 'Mexican', 'Italian', 'Thai', 'Japanese', 'Korean', 'American', 'Mediterranean', 'Vietnamese', 'French', 'German', 'British'];
      
      commonCategories.forEach(cat => {
        if (allText.includes(cat) && !categories.includes(cat)) {
          categories.push(cat);
        }
      });
    }
    
    if (categories.length > 0) {
      data.primaryCategory = categories[0];
      data.additionalCategories = categories.slice(1);
    }
    
    // Check if claimed (look for "Own this business?" or "Claim" button)
    const claimedSelectors = [
      'button[aria-label*="Own this business"]',
      'button[aria-label*="Claim"]',
      '[data-item-id="claim"]'
    ];
    
    for (const selector of claimedSelectors) {
      const el = document.querySelector(selector);
      if (el) {
        data.isClaimed = false;
        break;
      } else {
        data.isClaimed = true;
      }
    }
    
    // Extract Place ID and CID
    let placeId = null;
    let cid = null;
    
    // Pattern 1: Find ChIJ Place ID in the page HTML (most reliable)
    const html = document.documentElement.innerHTML;
    const chijMatch = html.match(/ChIJ[a-zA-Z0-9_\-]{20,30}/);
    if (chijMatch) {
      placeId = chijMatch[0];
    }
    
    // Pattern 2: Extract hex CID from URL for display
    const hexMatch = window.location.href.match(/!1s(0x[a-f0-9]+:0x[a-f0-9]+)/);
    if (hexMatch) {
      cid = hexMatch[1];
    }
    
    if (placeId) {
      data.placeId = placeId;
    }
    
    if (cid) {
      data.cid = cid;
    }
    
    
    // Mark as detected if we have at least a business name
    data.detected = data.businessName.length > 0;
    
  } catch (error) {
    console.error('Error extracting business data:', error);
  }
  
  return data;
}

// Check Website SEO
function checkWebsiteSEO() {
  const results = {
    hasLocalBusinessSchema: false,
    schemaType: null,
    hasName: false,
    hasAddress: false,
    hasPhone: false,
    hasMapsEmbed: false,
    hasGBPLink: false,
    gbpLinkCount: 0
  };
  
  try {
    // Check for LocalBusiness schema (JSON-LD)
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    jsonLdScripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        if (Array.isArray(data)) {
          data.forEach(item => {
            if (item['@type'] && item['@type'].includes('LocalBusiness')) {
              results.hasLocalBusinessSchema = true;
              results.schemaType = item['@type'];
            }
          });
        } else if (data['@type'] && data['@type'].includes('LocalBusiness')) {
          results.hasLocalBusinessSchema = true;
          results.schemaType = data['@type'];
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    });
    
    // Check for microdata schema
    const microdata = document.querySelector('[itemscope][itemtype*="LocalBusiness"]');
    if (microdata) {
      results.hasLocalBusinessSchema = true;
      results.schemaType = microdata.getAttribute('itemtype');
    }
    
    // Check for NAP on page
    const bodyText = document.body.textContent.toLowerCase();
    
    // Check for phone numbers (various formats)
    const phonePatterns = [
      /\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
      /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/
    ];
    for (const pattern of phonePatterns) {
      if (pattern.test(bodyText)) {
        results.hasPhone = true;
        break;
      }
    }
    
    // Check for address patterns
    const addressPatterns = [
      /\d+\s+[a-zA-Z]+\s+(street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr)/i,
      /\d+\s+[a-zA-Z]+,\s*[a-zA-Z]+/i
    ];
    for (const pattern of addressPatterns) {
      if (pattern.test(bodyText)) {
        results.hasAddress = true;
        break;
      }
    }
    
    // Check for business name (look for h1, h2, or title)
    const h1 = document.querySelector('h1');
    const h2 = document.querySelector('h2');
    const title = document.querySelector('title');
    if (h1 || h2 || title) {
      results.hasName = true;
    }
    
    // Check for Google Maps embed
    const mapsEmbeds = document.querySelectorAll('iframe[src*="google.com/maps"], iframe[src*="maps.google.com"]');
    results.hasMapsEmbed = mapsEmbeds.length > 0;
    
    // Check for GBP links
    const gbpLinks = document.querySelectorAll('a[href*="google.com/maps"], a[href*="maps.google.com"], a[href*="business.google.com"]');
    results.hasGBPLink = gbpLinks.length > 0;
    results.gbpLinkCount = gbpLinks.length;
    
  } catch (error) {
    console.error('Error checking website SEO:', error);
  }
  
  return results;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request.action);
  
  if (request.action === 'extractData') {
    const data = extractBusinessData();
    sendResponse(data);
  } else if (request.action === 'checkWebsiteSEO') {
    const results = checkWebsiteSEO();
    console.log('Website SEO check results:', results);
    sendResponse(results);
  }
  
  return true; // Keep message channel open for async response
});

// Notify that content script is loaded
chrome.runtime.sendMessage({ action: 'contentScriptLoaded' });
