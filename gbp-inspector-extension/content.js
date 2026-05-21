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
    
    // Extract categories - look for category button in the main section
    const excludeText = ['Add a label', 'Suggest an edit', 'Edit', 'Copy', 'Share', 'Save', 'Directions', 'Nearby', 'Send to phone', 'Menu', 'Website', 'Phone', 'Address', 'Hours', 'Plus code', 'Your Maps history', 'Price', 'Rating', 'All filters', 'Back to top', 'Dine-in', 'Takeout', 'Delivery', 'No-contact delivery', 'Search this area', 'Recents', 'Get app', 'See photos', 'Overview', 'Reviews', 'About', 'Write a review', 'Sort', 'All', 'See more', 'Like', 'Learn more', 'Show slider', 'Hide slider', 'Transit', 'Traffic', 'Biking', 'Terrain', 'Street View', 'Wildfires', 'Air Quality', 'Travel time', 'Measure', 'Default', 'Satellite', 'Globe view', 'Labels', 'Global', 'Terms', 'Privacy'];
    const categories = [];
    
    // Look for category in the business info section specifically
    const infoSection = document.querySelector('[role="region"][aria-label*="Information"], [role="region"][aria-label*="About"]');
    if (infoSection) {
      const buttons = infoSection.querySelectorAll('button');
      buttons.forEach(el => {
        if (el.textContent) {
          const text = el.textContent.trim();
          if (!categories.includes(text) && 
              !excludeText.some(exclude => text.toLowerCase().includes(exclude.toLowerCase())) && 
              text.length > 2 && 
              text.length < 50 &&
              text.split(' ').length <= 3 &&
              !text.includes(':') &&
              !text.includes('Rs') &&
              !text.includes('stars') &&
              !text.includes('reviews') &&
              !text.includes('filters') &&
              !text.includes('back') &&
              !text.includes('+') &&
              !text.match(/^\d/)) {
            categories.push(text);
          }
        }
      });
    }
    
    // If no categories found in info section, try broader search
    if (categories.length === 0) {
      const categoryButtons = document.querySelectorAll('button');
      categoryButtons.forEach(el => {
        if (el.textContent) {
          const text = el.textContent.trim();
          if (!categories.includes(text) && 
              !excludeText.some(exclude => text.toLowerCase().includes(exclude.toLowerCase())) && 
              text.length > 2 && 
              text.length < 50 &&
              text.split(' ').length <= 3 &&
              !text.includes(':') &&
              !text.includes('Rs') &&
              !text.includes('stars') &&
              !text.includes('reviews') &&
              !text.includes('filters') &&
              !text.includes('back') &&
              !text.includes('+') &&
              !text.match(/^\d/)) {
            categories.push(text);
          }
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
    
    // Extract Place ID from URL
    const urlMatch = window.location.href.match(/!1s([a-zA-Z0-9_-]+)/);
    if (urlMatch) {
      data.placeId = urlMatch[1];
    }
    
    const cidMatch = window.location.href.match(/!1d([0-9]+)/);
    if (cidMatch) {
      data.cid = cidMatch[1];
    }
    
    // Mark as detected if we have at least a business name
    data.detected = data.businessName.length > 0;
    
  } catch (error) {
    console.error('Error extracting business data:', error);
  }
  
  return data;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractData') {
    const data = extractBusinessData();
    sendResponse(data);
  }
});

// Notify that content script is loaded
chrome.runtime.sendMessage({ action: 'contentScriptLoaded' });
