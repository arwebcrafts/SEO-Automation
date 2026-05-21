// Popup Script - Handles UI and communication with content script

console.log('GBP Inspector Popup Loaded');

let businessData = null;
let competitors = [];
let currentTab = 'audit';
let originalBusinessData = null; // Store the business being compared against
let napProfiles = []; // Store NAP profiles


// Load competitors from storage
function loadCompetitorsFromStorage() {
  chrome.storage.local.get(['competitors', 'originalBusiness', 'napProfiles'], (result) => {
    if (result.competitors) {
      competitors = result.competitors;
    }
    if (result.originalBusiness) {
      originalBusinessData = result.originalBusiness;
    }
    if (result.napProfiles) {
      napProfiles = result.napProfiles;
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
  } else if (tab === 'nap') {
    loadNAPContent();
  } else if (tab === 'website') {
    loadWebsiteSEOContent();
  }
}

// Add tab click listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tab-audit-btn').addEventListener('click', () => switchTab('audit'));
  document.getElementById('tab-competitors-btn').addEventListener('click', () => switchTab('competitors'));
  document.getElementById('tab-nap-btn').addEventListener('click', () => switchTab('nap'));
  document.getElementById('tab-website-btn').addEventListener('click', () => switchTab('website'));
  
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
  } else if (buttonText.includes('Add NAP Profile')) {
    showNAPForm();
  } else if (buttonText === 'Save Profile') {
    const name = document.getElementById('nap-name').value;
    const address = document.getElementById('nap-address').value;
    const phone = document.getElementById('nap-phone').value;
    const website = document.getElementById('nap-website').value;
    
    if (!name || !address || !phone) {
      alert('Please fill in at least Name, Address, and Phone');
      return;
    }
    
    saveNAPProfile(name, address, phone, website);
  } else if (buttonText === 'Cancel') {
    loadNAPContent();
  } else if (buttonText.includes('Import Current Business NAP')) {
    importCurrentBusinessNAP();
  } else if (buttonText === 'Delete') {
    const deleteIndex = button.getAttribute('data-delete-nap');
    if (deleteIndex !== null) {
      deleteNAPProfile(parseInt(deleteIndex));
    }
  } else if (buttonText.includes('Run Website SEO Check')) {
    runWebsiteSEOCheck();
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

function loadNAPContent() {
  const container = document.getElementById('nap-content');
  
  container.innerHTML = `
    <div class="card">
      <div class="card-title">📋 NAP Profiles</div>
      <p style="font-size: 12px; color: #6b7280; margin-bottom: 12px;">Store business Name, Address, Phone for citation building</p>
      
      ${napProfiles.length === 0 ? `
        <div style="text-align: center; padding: 20px; color: #6b7280;">
          <p>No NAP profiles saved yet.</p>
        </div>
      ` : napProfiles.map((profile, index) => `
        <div class="nap-profile">
          <div class="nap-profile-name">${escapeHtml(profile.name)}</div>
          <div class="nap-field"><strong>Address:</strong> ${escapeHtml(profile.address)}</div>
          <div class="nap-field"><strong>Phone:</strong> ${escapeHtml(profile.phone)}</div>
          <div class="nap-field"><strong>Website:</strong> ${escapeHtml(profile.website)}</div>
          <button style="margin-top: 8px; padding: 4px 8px; font-size: 11px; background: #fee2e2; color: #dc2626; border: none; border-radius: 4px; cursor: pointer;" data-delete-nap="${index}">Delete</button>
        </div>
      `).join('')}
      
      <button class="btn btn-secondary" style="margin-top: 12px;">➕ Add NAP Profile</button>
    </div>
    
    ${businessData ? `
      <div class="card">
        <div class="card-title">📥 Import from Current Business</div>
        <p style="font-size: 12px; color: #6b7280; margin-bottom: 12px;">Import NAP data from the current GBP listing</p>
        <button class="btn btn-secondary">Import Current Business NAP</button>
      </div>
    ` : ''}
  `;
}

function loadWebsiteSEOContent() {
  console.log('loadWebsiteSEOContent called');
  const container = document.getElementById('website-content');
  console.log('website-content container:', container);
  
  container.innerHTML = `
    <div style="background:white; border-radius:12px; padding:16px; margin-bottom:12px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
      <div style="font-weight:700; color:#1f2937; margin-bottom:8px;">🌐 Website Local SEO Checker</div>
      <p style="font-size:12px; color:#6b7280; margin-bottom:12px;">Check this website for local SEO signals</p>
      <button id="run-seo-check-btn" style="width:100%; padding:10px; background:linear-gradient(135deg,#667eea,#764ba2); color:white; border:none; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer;">Run Website SEO Check</button>
      <div id="seo-check-status" style="margin-top:8px; font-size:12px; color:#6b7280;"></div>
    </div>
    <div id="website-seo-results"></div>
  `;
  
  const btn = document.getElementById('run-seo-check-btn');
  console.log('run-seo-check-btn found:', btn);
  btn.addEventListener('click', () => {
    console.log('Run Website SEO Check button clicked!');
    runWebsiteSEOCheck();
  });
}

function displayAuditContent(data, container) {
  const score = calculateGBPScore(data);
  const scoreClass = score >= 70 ? 'score-high' : score >= 40 ? 'score-medium' : 'score-low';
  
  container.innerHTML = `
    <div class="card">
      <div class="business-name">${escapeHtml(data.businessName)}</div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px;">
        <span class="status-badge ${data.detected ? 'status-detected' : 'status-not-detected'}">
          ${data.detected ? '✓ Business Detected' : '✗ Not Detected'}
        </span>
        ${data.isClaimed !== null ? `
          <span class="status-badge ${data.isClaimed ? 'status-claimed' : 'status-unclaimed'}">
            ${data.isClaimed ? '🔒 Claimed' : '🔓 Unclaimed'}
          </span>
        ` : ''}
      </div>
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
        ${data.isClaimed ? '<div class="checklist-item pass">✓ GBP Claimed</div>' : data.isClaimed === false ? '<div class="checklist-item fail">✗ GBP Unclaimed</div>' : ''}
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

// Show NAP form
function showNAPForm() {
  const container = document.getElementById('nap-content');
  
  container.innerHTML = `
    <div class="card">
      <div class="card-title">➕ Add NAP Profile</div>
      <div class="nap-form">
        <input type="text" class="nap-input" id="nap-name" placeholder="Business Name" />
        <input type="text" class="nap-input" id="nap-address" placeholder="Address" />
        <input type="text" class="nap-input" id="nap-phone" placeholder="Phone Number" />
        <input type="text" class="nap-input" id="nap-website" placeholder="Website" />
        <button class="btn btn-primary" style="margin-top: 8px;">Save Profile</button>
        <button class="btn btn-secondary" style="margin-top: 8px;">Cancel</button>
      </div>
    </div>
  `;
}

// Save NAP profile
function saveNAPProfile(name, address, phone, website) {
  const profile = {
    name: name.trim(),
    address: address.trim(),
    phone: phone.trim(),
    website: website.trim()
  };
  
  napProfiles.push(profile);
  chrome.storage.local.set({ napProfiles });
  loadNAPContent();
}

// Delete NAP profile
function deleteNAPProfile(index) {
  if (confirm('Are you sure you want to delete this NAP profile?')) {
    napProfiles.splice(index, 1);
    chrome.storage.local.set({ napProfiles });
    loadNAPContent();
  }
}

// Import current business NAP
function importCurrentBusinessNAP() {
  if (!businessData || !businessData.detected) {
    alert('No business data available to import.');
    return;
  }
  
  const profile = {
    name: businessData.businessName,
    address: businessData.address || '',
    phone: businessData.phone || '',
    website: businessData.website || ''
  };
  
  napProfiles.push(profile);
  chrome.storage.local.set({ napProfiles });
  loadNAPContent();
}

// Run Website SEO Check - uses scripting.executeScript directly (no message passing)
async function runWebsiteSEOCheck() {
  const statusDiv = document.getElementById('seo-check-status');
  const btn = document.getElementById('run-seo-check-btn');
  
  console.log('runWebsiteSEOCheck called');
  if (statusDiv) statusDiv.textContent = 'Checking...';
  if (btn) btn.disabled = true;
  
  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const tab = tabs[0];
    
    console.log('Active tab:', tab ? tab.url : 'none', 'id:', tab ? tab.id : 'none');
    
    if (!tab || !tab.url) {
      if (statusDiv) statusDiv.textContent = 'Error: No active tab found';
      if (btn) btn.disabled = false;
      return;
    }
    
    if (statusDiv) statusDiv.textContent = 'Running on: ' + tab.url.substring(0, 40) + '...';
    
    // Execute the check directly in the page context - no message passing needed
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
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
        
        // Check JSON-LD schema
        document.querySelectorAll('script[type="application/ld+json"]').forEach(script => {
          try {
            const data = JSON.parse(script.textContent);
            const items = Array.isArray(data) ? data : [data];
            items.forEach(item => {
              if (item['@type'] && String(item['@type']).includes('LocalBusiness')) {
                results.hasLocalBusinessSchema = true;
                results.schemaType = String(item['@type']);
              }
            });
          } catch (e) {}
        });
        
        // Check microdata
        const microdata = document.querySelector('[itemscope][itemtype*="LocalBusiness"]');
        if (microdata) {
          results.hasLocalBusinessSchema = true;
          results.schemaType = microdata.getAttribute('itemtype');
        }
        
        // Check phone
        const bodyText = document.body.textContent;
        if (/(\+?\d[\d\s\-().]{6,}\d)/.test(bodyText)) results.hasPhone = true;
        
        // Check address
        if (/\d+\s+\w+.*(street|st|avenue|ave|road|rd|blvd|lane|ln|drive|dr|block|phase|sector)/i.test(bodyText)) {
          results.hasAddress = true;
        }
        
        // Check business name (h1 present)
        results.hasName = !!document.querySelector('h1');
        
        // Check Maps embed
        results.hasMapsEmbed = document.querySelectorAll('iframe[src*="google.com/maps"], iframe[src*="maps.google.com"]').length > 0;
        
        // Check GBP links
        const gbpLinks = document.querySelectorAll('a[href*="google.com/maps"], a[href*="maps.google.com"], a[href*="business.google.com"]');
        results.hasGBPLink = gbpLinks.length > 0;
        results.gbpLinkCount = gbpLinks.length;
        
        return results;
      }
    });
    
    console.log('executeScript result:', JSON.stringify(result));
    
    if (result) {
      console.log('hasLocalBusinessSchema:', result.hasLocalBusinessSchema);
      console.log('hasPhone:', result.hasPhone);
      console.log('hasAddress:', result.hasAddress);
      console.log('hasName:', result.hasName);
      console.log('hasMapsEmbed:', result.hasMapsEmbed);
      console.log('hasGBPLink:', result.hasGBPLink);
      displayWebsiteSEOResults(result);
      if (statusDiv) statusDiv.textContent = '';
    } else {
      console.warn('result is null/undefined');
      if (statusDiv) statusDiv.textContent = 'Error: No results returned';
    }
  } catch (error) {
    console.error('Website SEO check error:', error.message, error.stack);
    if (statusDiv) statusDiv.textContent = 'Error: ' + error.message;
  } finally {
    if (btn) btn.disabled = false;
  }
}

// Display Website SEO Results
function displayWebsiteSEOResults(results) {
  const container = document.getElementById('website-seo-results');
  container.style.display = 'block';
  
  const score = calculateWebsiteSEOScore(results);
  const scoreClass = score >= 70 ? 'score-high' : score >= 40 ? 'score-medium' : 'score-low';
  
  container.innerHTML = `
    <div class="card">
      <div class="card-title">📊 Website SEO Score</div>
      <div class="score-display">
        <div class="score-circle ${scoreClass}">${score}</div>
        <div class="score-label">Local SEO Score</div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">🔍 Schema Markup</div>
      <div class="checklist">
        ${results.hasLocalBusinessSchema ? '<div class="checklist-item pass">✓ LocalBusiness Schema Found</div>' : '<div class="checklist-item fail">✗ No LocalBusiness Schema</div>'}
        ${results.schemaType ? `<div class="checklist-item pass">✓ Schema Type: ${escapeHtml(results.schemaType)}</div>` : ''}
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">📍 NAP Information</div>
      <div class="checklist">
        ${results.hasName ? '<div class="checklist-item pass">✓ Business Name on Page</div>' : '<div class="checklist-item fail">✗ No Business Name Found</div>'}
        ${results.hasAddress ? '<div class="checklist-item pass">✓ Address on Page</div>' : '<div class="checklist-item fail">✗ No Address Found</div>'}
        ${results.hasPhone ? '<div class="checklist-item pass">✓ Phone Number on Page</div>' : '<div class="checklist-item fail">✗ No Phone Number Found</div>'}
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">🗺️ Google Maps Integration</div>
      <div class="checklist">
        ${results.hasMapsEmbed ? '<div class="checklist-item pass">✓ Google Maps Embed Found</div>' : '<div class="checklist-item fail">✗ No Google Maps Embed</div>'}
        ${results.hasGBPLink ? '<div class="checklist-item pass">✓ GBP Link Found</div>' : '<div class="checklist-item fail">✗ No GBP Link</div>'}
        ${results.gbpLinkCount > 0 ? `<div class="checklist-item pass">✓ ${results.gbpLinkCount} GBP Link(s) Found</div>` : ''}
      </div>
    </div>
  `;
}

// Calculate Website SEO Score
function calculateWebsiteSEOScore(results) {
  let score = 0;
  const maxScore = 100;
  
  // Schema markup (30 points)
  if (results.hasLocalBusinessSchema) score += 30;
  
  // NAP information (40 points - 13.33 each)
  if (results.hasName) score += 13;
  if (results.hasAddress) score += 13;
  if (results.hasPhone) score += 14;
  
  // Google Maps integration (30 points - 15 each)
  if (results.hasMapsEmbed) score += 15;
  if (results.hasGBPLink) score += 15;
  
  return Math.min(score, maxScore);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
