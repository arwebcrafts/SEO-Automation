// Popup Script - Handles UI and communication with content script

console.log('GBP Inspector Popup Loaded');

let businessData = null;
let competitors = [];
let currentTab = 'audit';
let originalBusinessData = null; // Store the business being compared against


// Load competitors from storage
function loadCompetitorsFromStorage() {
  chrome.storage.local.get(['competitors'], (result) => {
    if (result.competitors) {
      competitors = result.competitors;
    }
  });
}

// Tab switching function
function switchTab(tab) {
  currentTab = tab;
  
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.getElementById(`tab-${tab}-btn`).classList.add('active');
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tab}-content`).classList.add('active');
  
  // Load content for the tab
  if (tab === 'audit') {
    loadAuditContent();
  } else if (tab === 'competitors') {
    loadCompetitorsContent();
  }
}

// Add tab click listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tab-audit-btn').addEventListener('click', () => switchTab('audit'));
  document.getElementById('tab-competitors-btn').addEventListener('click', () => switchTab('competitors'));
  
  loadCompetitorsFromStorage();
  checkCurrentTab();
});

// Add competitor button click listener (dynamic since button is injected)
document.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (!button) return;
  
  const buttonText = button.textContent;
  
  if (buttonText.includes('Add Competitor')) {
    addCurrentAsCompetitor();
  } else if (buttonText.includes('Remove')) {
    const businessName = button.getAttribute('data-business-name');
    if (businessName) {
      removeCompetitor(businessName);
    }
  } else if (buttonText.includes('Clear All')) {
    clearCompetitors();
  } else if (buttonText.includes('Reset to Original')) {
    resetToOriginalBusiness();
  } else if (buttonText.includes('Generate Review Link')) {
    generateReviewLink();
  } else if (buttonText.includes('Export to CSV')) {
    exportToCSV();
  } else if (buttonText.includes('Open Full Audit')) {
    openFullAudit();
  } else if (buttonText.includes('Go to Google Maps')) {
    openGoogleMaps();
  } else if (buttonText.includes('Try Again')) {
    checkCurrentTab();
  } else if (buttonText === 'Copy') {
    const copyType = button.getAttribute('data-copy');
    if (copyType === 'placeid' && businessData.placeId) {
      copyToClipboard(businessData.placeId, button);
    } else if (copyType === 'cid' && businessData.cid) {
      copyToClipboard(businessData.cid, button);
    }
  }
});

// Check if current tab is Google Maps
async function checkCurrentTab() {
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
    loadContent();
    
  } catch (error) {
    console.error('Error checking tab:', error);
    showError('Unable to access current tab');
  }
}

// Load content from content script
async function loadContent() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab || !tab.url) {
    showError('Unable to access current tab');
    return;
  }
  
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractData' });
    businessData = response;
    loadAuditContent();
  } catch (error) {
    console.error('Error loading content:', error);
    showError('Failed to extract business data. Make sure you\'re on a Google Maps business listing.');
  }
}

function loadAuditContent() {
  const container = document.getElementById('audit-content');
  
  if (!businessData || !businessData.detected) {
    container.innerHTML = `
      <div class="no-data">
        <div class="no-data-icon">🔍</div>
        <h3>No Business Detected</h3>
        <p>Make sure you're viewing a business listing on Google Maps, not the search results page.</p>
        <p>Click on a business to view its full listing first.</p>
      </div>
    `;
    return;
  }
  
  displayAuditContent(businessData, container);
}

function loadCompetitorsContent() {
  const container = document.getElementById('competitors-content');
  
  // Use original business data if available, otherwise use current business data
  const displayData = originalBusinessData || businessData;
  
  if (!displayData || !displayData.detected) {
    container.innerHTML = `
      <div class="no-data">
        <div class="no-data-icon">🔍</div>
        <h3>No Business Detected</h3>
        <p>Please extract business data first by switching to the Audit tab.</p>
      </div>
    `;
    return;
  }
  
  displayCompetitorsContent(displayData, container);
}

function displayAuditContent(data, container) {
  const score = calculateGBPScore(data);
  const scoreClass = score >= 70 ? 'score-high' : score >= 40 ? 'score-medium' : 'score-low';
  
  container.innerHTML = `
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
    
    <button class="btn btn-primary">
      📥 Export to CSV
    </button>
    
    <button class="btn btn-secondary" id="review-link-btn">
      🔗 Generate Review Link
    </button>
    
    <button class="btn btn-secondary">
      🔍 Open Full Audit in Web App
    </button>
  `;
}

function displayCompetitorsContent(data, container) {
  const yourCategories = [data.primaryCategory, ...data.additionalCategories].filter(c => c);
  const isOriginal = originalBusinessData && originalBusinessData.businessName === data.businessName;
  
  container.innerHTML = `
    <div class="card">
      <div class="card-title">🏆 Your Categories</div>
      <div class="business-name">${data.businessName} ${isOriginal ? '<span style="font-size: 11px; color: #16a34a; margin-left: 8px;">(Original)</span>' : ''}</div>
      <div style="font-size: 12px; color: #6b7280; margin-bottom: 12px;">
        ${yourCategories.map(c => `<span style="background: #e0e7ff; color: #667eea; padding: 4px 8px; border-radius: 12px; margin-right: 4px; margin-bottom: 4px; display: inline-block;">${c}</span>`).join('')}
      </div>
      <button class="btn btn-secondary">➕ Add Competitor (Current Page)</button>
      ${!isOriginal && originalBusinessData ? `<button class="btn btn-secondary" style="margin-top: 8px;">🔄 Reset to Original Business</button>` : ''}
    </div>
    
    <div class="card">
      <div class="card-title">📊 Competitor Comparison</div>
      <div id="competitor-list">
        ${competitors.length === 0 ? `
          <div style="text-align: center; padding: 20px; color: #6b7280;">
            <p>No competitors added yet.</p>
            <p style="font-size: 11px; margin-top: 8px;">Navigate to a competitor's Google Maps listing and click "Add Competitor" above.</p>
          </div>
        ` : competitors.map(comp => displayCompetitorItem(comp, yourCategories)).join('')}
      </div>
    </div>
    
    ${competitors.length > 0 ? `
      <div class="card">
        <div class="card-title">📋 Category Gap Analysis</div>
        ${displayCategoryGaps(yourCategories, competitors)}
      </div>
      
      <button class="btn btn-secondary">🗑️ Clear All Competitors</button>
    ` : ''}
  `;
}

function displayCompetitorItem(competitor, yourCategories) {
  const competitorCategories = [competitor.primaryCategory, ...competitor.additionalCategories].filter(c => c);
  const yourCatSet = new Set(yourCategories.map(c => c.toLowerCase()));
  const competitorCatSet = new Set(competitorCategories.map(c => c.toLowerCase()));
  
  const missingFromYou = competitorCategories.filter(c => !yourCatSet.has(c.toLowerCase()));
  const missingFromThem = yourCategories.filter(c => !competitorCatSet.has(c.toLowerCase()));
  
  const escapedName = competitor.businessName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  
  return `
    <div class="competitor-item">
      <div class="competitor-name">${competitor.businessName}</div>
      <div class="competitor-categories">
        ${competitorCategories.map(c => `<span style="background: ${yourCatSet.has(c.toLowerCase()) ? '#dcfce7' : '#fef3c7'}; color: ${yourCatSet.has(c.toLowerCase()) ? '#16a34a' : '#d97706'}; padding: 4px 8px; border-radius: 12px; margin-right: 4px; margin-bottom: 4px; display: inline-block; font-size: 11px;">${c}</span>`).join('')}
      </div>
      ${missingFromYou.length > 0 ? `<div style="font-size: 11px; color: #dc2626; margin-top: 4px;">Missing from you: ${missingFromYou.join(', ')}</div>` : ''}
      ${missingFromThem.length > 0 ? `<div style="font-size: 11px; color: #16a34a; margin-top: 4px;">You have, they don't: ${missingFromThem.join(', ')}</div>` : ''}
      <button style="margin-top: 8px; padding: 4px 8px; font-size: 11px; background: #fee2e2; color: #dc2626; border: none; border-radius: 4px; cursor: pointer;" onclick="removeCompetitor('${escapedName}')">Remove</button>
    </div>
  `;
}

function displayCategoryGaps(yourCategories, competitorList) {
  const allCategories = new Set(yourCategories);
  competitorList.forEach(comp => {
    [comp.primaryCategory, ...comp.additionalCategories].filter(c => c).forEach(c => allCategories.add(c));
  });
  
  const yourCatSet = new Set(yourCategories.map(c => c.toLowerCase()));
  const missingCategories = Array.from(allCategories).filter(c => !yourCatSet.has(c.toLowerCase()));
  
  if (missingCategories.length === 0) {
    return '<p style="color: #16a34a; font-size: 12px;">✓ You have all the categories your competitors use!</p>';
  }
  
  return `
    <div style="margin-bottom: 12px;">
      <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">Categories competitors have that you don't:</div>
      ${missingCategories.map(cat => {
        const competitorsWithCat = competitorList.filter(comp => {
          const compCats = [comp.primaryCategory, ...comp.additionalCategories].filter(c => c);
          return compCats.some(c => c.toLowerCase() === cat.toLowerCase());
        });
        return `<div style="font-size: 12px; margin-bottom: 4px;">
          <span class="category-missing">⚠️ ${cat}</span>
          <span style="color: #9ca3af; font-size: 11px;"> (${competitorsWithCat.map(c => c.businessName).join(', ')})</span>
        </div>`;
      }).join('')}
    </div>
  `;
}

async function addCurrentAsCompetitor() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab || !tab.url) {
    alert('Unable to access current tab');
    return;
  }
  
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'extractData' });
    
    if (!response.detected) {
      alert('No business detected on this page');
      return;
    }
    
    // Check if already exists
    if (competitors.some(c => c.businessName === response.businessName)) {
      alert('This competitor is already added');
      return;
    }
    
    competitors.push(response);
    chrome.storage.local.set({ competitors });
    loadCompetitorsContent();
  } catch (error) {
    console.error('Error adding competitor:', error);
    alert('Failed to add competitor');
  }
}

function removeCompetitor(businessName) {
  competitors = competitors.filter(c => c.businessName !== businessName);
  chrome.storage.local.set({ competitors });
  loadCompetitorsContent();
}

function clearCompetitors() {
  if (confirm('Are you sure you want to clear all competitors?')) {
    competitors = [];
    chrome.storage.local.set({ competitors });
    loadCompetitorsContent();
  }
}

// Show loading state
function showLoading() {
  const container = document.getElementById('audit-content');
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Analyzing Google Maps listing...</p>
    </div>
  `;
}

// Show "not on Google Maps" message
function showNotOnMaps() {
  const container = document.getElementById('audit-content');
  container.innerHTML = `
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

// Show no data message
function showNoData(message) {
  const container = document.getElementById('audit-content');
  container.innerHTML = `
    <div class="no-data">
      <div class="no-data-icon">⚠️</div>
      <p>${message}</p>
    </div>
  `;
}

// Show error message
function showError(message) {
  const container = document.getElementById('audit-content');
  container.innerHTML = `
    <div class="error">
      <strong>Error:</strong> ${escapeHtml(message)}
    </div>
    <button class="btn btn-secondary" onclick="checkCurrentTab()" onclick="checkCurrentTab()">
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

// Generate Review Link
function generateReviewLink() {
  if (!businessData || !businessData.placeId) {
    alert('No Place ID found. Cannot generate review link.');
    return;
  }
  
  const reviewLink = `https://search.google.com/local/writereview?placeid=${businessData.placeId}`;
  
  // Copy to clipboard
  navigator.clipboard.writeText(reviewLink).then(() => {
    // Show success message
    const btn = document.getElementById('review-link-btn');
    const originalText = btn.textContent;
    btn.textContent = '✓ Copied!';
    btn.style.background = '#dcfce7';
    btn.style.color = '#16a34a';
    
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
      btn.style.color = '';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
    // Fallback: open the link directly
    chrome.tabs.create({ url: reviewLink });
  });
}

// Copy to clipboard with visual feedback
function copyToClipboard(text, button) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = button.textContent;
    button.textContent = '✓';
    button.style.background = '#dcfce7';
    button.style.color = '#16a34a';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '#e0e7ff';
      button.style.color = '#667eea';
    }, 1500);
  }).catch(err => {
    console.error('Failed to copy:', err);
    alert('Failed to copy to clipboard');
  });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
