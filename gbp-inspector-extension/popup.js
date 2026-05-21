// Popup Script - Handles UI and communication with content script

console.log('GBP Inspector Popup Loaded');

let businessData = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  checkCurrentTab();
});

// Check if current tab is Google Maps
async function checkCurrentTab() {
  const content = document.getElementById('content');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url) {
      showNoData('Please navigate to a webpage');
      return;
    }
    
    if (!tab.url.includes('google.com/maps') && !tab.url.includes('maps.google.com')) {
      showNotOnMaps();
      return;
    }
    
    // We're on Google Maps, try to extract data
    showLoading();
    extractDataFromTab(tab);
    
  } catch (error) {
    console.error('Error checking tab:', error);
    showError('Unable to access current tab');
  }
}

// Extract data from the active tab
async function extractDataFromTab(tab) {
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractData' });
    
    if (response && response.detected) {
      businessData = response;
      showBusinessData(response);
    } else {
      showNoBusinessDetected();
    }
  } catch (error) {
    console.error('Error extracting data:', error);
    showNoBusinessDetected();
  }
}

// Show loading state
function showLoading() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Analyzing Google Maps listing...</p>
    </div>
  `;
}

// Show business data
function showBusinessData(data) {
  const content = document.getElementById('content');
  const score = calculateGBPScore(data);
  const scoreClass = score >= 70 ? 'score-high' : score >= 40 ? 'score-medium' : 'score-low';
  
  content.innerHTML = `
    <div class="card">
      <div class="business-name">${escapeHtml(data.businessName)}</div>
      <span class="status-badge ${data.detected ? 'status-detected' : 'status-not-detected'}">
        ${data.detected ? '✓ Business Detected' : '✗ Not Detected'}
      </span>
    </div>
    
    <div class="card">
      <div class="card-title">📊 Quick GBP Score</div>
      <div class="score-display">
        <div class="score-circle ${scoreClass}">${score}</div>
        <div class="score-label">Completeness Score</div>
      </div>
      <div class="checklist">
        ${data.businessName ? '<div class="checklist-item pass">✓ Business Name</div>' : '<div class="checklist-item fail">✗ Business Name</div>'}
        ${data.primaryCategory ? '<div class="checklist-item pass">✓ Primary Category</div>' : '<div class="checklist-item fail">✗ Primary Category</div>'}
        ${data.address ? '<div class="checklist-item pass">✓ Address</div>' : '<div class="checklist-item fail">✗ Address</div>'}
        ${data.phone ? '<div class="checklist-item pass">✓ Phone Number</div>' : '<div class="checklist-item fail">✗ Phone Number</div>'}
        ${data.website ? '<div class="checklist-item pass">✓ Website</div>' : '<div class="checklist-item fail">✗ Website</div>'}
        ${data.hasWorkHours ? '<div class="checklist-item pass">✓ Business Hours</div>' : '<div class="checklist-item fail">✗ Business Hours</div>'}
        ${parseInt(data.photoCount) >= 5 ? '<div class="checklist-item pass">✓ Photos (5+)</div>' : '<div class="checklist-item fail">✗ Photos (need 5+)</div>'}
        ${data.rating ? '<div class="checklist-item pass">✓ Reviews</div>' : '<div class="checklist-item fail">✗ Reviews</div>'}
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">🏷️ Categories</div>
      ${data.primaryCategory ? `
        <div class="category-item">
          <span class="category-label">Primary:</span>
          <span class="category-value">${escapeHtml(data.primaryCategory)}</span>
        </div>
      ` : '<div class="category-item"><span class="category-label">Primary:</span><span class="category-value">Not found</span></div>'}
      
      ${data.additionalCategories.length > 0 ? data.additionalCategories.map((cat, index) => `
        <div class="category-item">
          <span class="category-label">Secondary ${index + 1}:</span>
          <span class="category-value">${escapeHtml(cat)}</span>
        </div>
      `).join('') : '<div class="category-item"><span class="category-label">Secondary:</span><span class="category-value">None</span></div>'}
    </div>
    
    <div class="card">
      <div class="card-title">📋 Business Details</div>
      ${data.address ? `
        <div class="category-item">
          <span class="category-label">Address:</span>
          <span class="category-value">${escapeHtml(data.address)}</span>
        </div>
      ` : ''}
      ${data.phone ? `
        <div class="category-item">
          <span class="category-label">Phone:</span>
          <span class="category-value">${escapeHtml(data.phone)}</span>
        </div>
      ` : ''}
      ${data.website ? `
        <div class="category-item">
          <span class="category-label">Website:</span>
          <span class="category-value" style="word-break: break-all;">${escapeHtml(data.website)}</span>
        </div>
      ` : ''}
      ${data.rating ? `
        <div class="category-item">
          <span class="category-label">Rating:</span>
          <span class="category-value">${escapeHtml(data.rating)} ⭐ (${data.reviewCount || 0} reviews)</span>
        </div>
      ` : ''}
      ${data.placeId ? `
        <div class="category-item">
          <span class="category-label">Place ID:</span>
          <span class="category-value" style="font-size: 11px;">${escapeHtml(data.placeId)}</span>
        </div>
      ` : ''}
    </div>
    
    <button class="btn btn-primary" onclick="exportToCSV()">
      📥 Export to CSV
    </button>
    
    <button class="btn btn-secondary" onclick="openFullAudit()">
      🔍 Open Full Audit in Web App
    </button>
  `;
}

// Show "not on Google Maps" message
function showNotOnMaps() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="no-data">
      <div class="no-data-icon">🗺️</div>
      <p><strong>Not on Google Maps</strong></p>
      <p>Navigate to a Google Maps business listing to extract categories and check GBP score.</p>
      <button class="btn btn-primary" style="margin-top: 16px;" onclick="openGoogleMaps()">
        Go to Google Maps
      </button>
    </div>
  `;
}

// Show no business detected
function showNoBusinessDetected() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="no-data">
      <div class="no-data-icon">🔍</div>
      <p><strong>No Business Detected</strong></p>
      <p>Make sure you're viewing a business listing on Google Maps, not the search results page.</p>
      <p style="margin-top: 8px;">Click on a business to view its full listing first.</p>
    </div>
  `;
}

// Show no data message
function showNoData(message) {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="no-data">
      <div class="no-data-icon">⚠️</div>
      <p>${message}</p>
    </div>
  `;
}

// Show error message
function showError(message) {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="error">
      <strong>Error:</strong> ${escapeHtml(message)}
    </div>
    <button class="btn btn-secondary" onclick="checkCurrentTab()">
      Try Again
    </button>
  `;
}

// Calculate GBP score
function calculateGBPScore(data) {
  let score = 0;
  let maxScore = 8;
  
  if (data.businessName) score++;
  if (data.primaryCategory) score++;
  if (data.address) score++;
  if (data.phone) score++;
  if (data.website) score++;
  if (data.hasWorkHours) score++;
  if (parseInt(data.photoCount) >= 5) score++;
  if (data.rating) score++;
  
  return Math.round((score / maxScore) * 100);
}

// Export to CSV
function exportToCSV() {
  if (!businessData) return;
  
  const csvContent = [
    ['Field', 'Value'],
    ['Business Name', businessData.businessName],
    ['Primary Category', businessData.primaryCategory],
    ['Additional Categories', businessData.additionalCategories.join(', ')],
    ['Address', businessData.address],
    ['Phone', businessData.phone],
    ['Website', businessData.website],
    ['Rating', businessData.rating],
    ['Review Count', businessData.reviewCount],
    ['Photo Count', businessData.photoCount],
    ['Has Work Hours', businessData.hasWorkHours ? 'Yes' : 'No'],
    ['Is Claimed', businessData.isClaimed ? 'Yes' : 'No'],
    ['Google Maps URL', businessData.googleMapsUrl],
    ['Place ID', businessData.placeId],
    ['CID', businessData.cid],
    ['GBP Score', calculateGBPScore(businessData)]
  ]
  .map(row => row.map(cell => `"${cell}"`).join(','))
  .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${businessData.businessName.replace(/[^a-z0-9]/gi, '_')}_gbp_data.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Open full audit in web app
function openFullAudit() {
  if (!businessData) return;
  
  const url = `https://seo-try.vercel.app/gbp-audit?url=${encodeURIComponent(businessData.googleMapsUrl)}`;
  chrome.tabs.create({ url });
}

// Open Google Maps
function openGoogleMaps() {
  chrome.tabs.create({ url: 'https://www.google.com/maps' });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
