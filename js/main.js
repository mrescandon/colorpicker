// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Global variables
let tooltip = null;
let schoolData = null;
let selectedColors = new Map();

// Create and append tooltip element
function createTooltip() {
    tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    document.body.appendChild(tooltip);
}

// Initialize the application
async function initializeApp() {
    createTooltip();
    setupClipboardToggle();
    
    try {
        console.log('Attempting to fetch JSON data...');
        // Fetch the JSON data
        const response = await fetch('data/schools.json');
        console.log('Response received:', response);
        
        const text = await response.text();
        console.log('Raw JSON text:', text.substring(0, 500) + '...'); // Show first 500 chars
        
        try {
            schoolData = JSON.parse(text);
            console.log('Parsed JSON structure:', {
                hasConferences: !!schoolData.conferences,
                conferences: schoolData.conferences ? Object.keys(schoolData.conferences) : null,
                secData: schoolData.conferences?.SEC ? {
                    hasFullName: !!schoolData.conferences.SEC.fullName,
                    hasSchools: !!schoolData.conferences.SEC.schools,
                    schoolCount: schoolData.conferences.SEC.schools?.length
                } : null
            });
            
            // Set up tab event listeners
            setupTabs();
            
            // Load initial conference (SEC by default)
            loadConference('SEC');
            
        } catch (parseError) {
            console.error('JSON parsing error:', parseError);
            console.log('Failed to parse near:', text.substring(0, 100) + '...');
        }
        
    } catch (error) {
        console.error('Fetch error:', error);
        console.error('Error stack:', error.stack);
    }
}

// Set up tab switching functionality
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all sections
            const sections = document.querySelectorAll('.conference-section');
            sections.forEach(section => section.classList.remove('active'));
            
            // Show selected section
            const conferenceId = tab.getAttribute('data-conference');
            const activeSection = document.getElementById(conferenceId);
            if (activeSection) {
                activeSection.classList.add('active');
            }
            
            // Load conference data
            loadConference(conferenceId);
        });
    });
}

// Load and display conference data
function loadConference(conferenceId) {
    console.log('Loading conference:', conferenceId);
    console.log('School data:', schoolData);
    
    const section = document.getElementById(conferenceId);
    if (!section) {
        console.error('Section not found:', conferenceId);
        return;
    }
    if (!schoolData) {
        console.error('No school data available');
        return;
    }
    if (!schoolData.conferences) {
        console.error('No conferences data available');
        return;
    }
    if (!schoolData.conferences[conferenceId]) {
        console.error('Conference not found:', conferenceId);
        return;
    }
    
    // Clear existing content
    section.innerHTML = '';
    
    // Add conference title
    const titleDiv = document.createElement('div');
    titleDiv.className = 'conference-title';
    titleDiv.textContent = schoolData.conferences[conferenceId].fullName;
    section.appendChild(titleDiv);
    
    // Get schools for this conference
    const schools = schoolData.conferences[conferenceId].schools;
    console.log('Schools for conference:', schools);
    
    // Create and append school cards
    schools.forEach(school => {
        console.log('Processing school:', school);
        const card = createSchoolCard(school);
        section.appendChild(card);
    });
}

// Create a card for a school
function createSchoolCard(school) {
    const card = document.createElement('div');
    card.className = 'school-card';
    
    // Add school name
    const nameDiv = document.createElement('div');
    nameDiv.className = 'school-name';
    nameDiv.textContent = school.fullName;
    card.appendChild(nameDiv);
    
    // Create colors container
    const colorsContainer = document.createElement('div');
    colorsContainer.className = 'colors-container';
    
    // Add primary color
    if (school.colors.primary) {
        colorsContainer.appendChild(createColorGroup('Primary', school.colors.primary));
    }
    
    // Add secondary color
    if (school.colors.secondary) {
        colorsContainer.appendChild(createColorGroup('Secondary', school.colors.secondary));
    }
    
    // Add additional colors
    if (school.colors.additional) {
        Object.entries(school.colors.additional).forEach(([name, color]) => {
            const formattedName = name
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            colorsContainer.appendChild(createColorGroup(formattedName, color, formattedName)); // Pass formattedName
        });
    }
    
    card.appendChild(colorsContainer);
    return card;
}

// Create a color group (swatch + label)
function createColorGroup(label, color, colorName = null) {
    const group = document.createElement('div');
    group.className = 'color-group';
    
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color;
    
    // Add click-to-copy functionality
    swatch.addEventListener('click', () => {
        // Create a temporary input element
        const tempInput = document.createElement('input');
        tempInput.value = color;
        document.body.appendChild(tempInput);
        tempInput.select();
        
        try {
            // Try to copy
            document.execCommand('copy');
            showTooltip('Copied: ' + color, swatch);
            
            // Add to selected colors
            const schoolName = swatch.closest('.school-card').querySelector('.school-name').textContent;
            const colorType = colorName || label; // Use colorName if provided
            addSelectedColor(color, schoolName, colorType);
            
            // Reset tooltip after 2 seconds
            setTimeout(() => {
                hideTooltip();
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            showTooltip('Error copying color', swatch);
        }
        
        // Clean up
        document.body.removeChild(tempInput);
    });
    
    // Add hover effect to show color value and name
    swatch.addEventListener('mouseenter', (e) => {
        const displayName = colorName ? `${colorName} • ${color}` : `${label} • ${color}`;
        showTooltip(displayName, swatch);
    });
    
    swatch.addEventListener('mouseleave', () => {
        hideTooltip();
    });
    
    const labelDiv = document.createElement('div');
    labelDiv.className = 'color-label';
    labelDiv.textContent = label;
    
    group.appendChild(swatch);
    group.appendChild(labelDiv);
    return group;
}

// Show tooltip
function showTooltip(text, element) {
    if (!tooltip) return;
    
    tooltip.textContent = text;
    tooltip.style.opacity = '1';
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
}

// Hide tooltip
function hideTooltip() {
    if (!tooltip) return;
    tooltip.style.opacity = '0';
}

// Theme Toggle Functionality
function initializeTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

// Selected colors management
function addSelectedColor(color, schoolName, colorType) {
    const colorKey = `${schoolName}-${color}`; // Unique key for each color
    if (selectedColors.has(colorKey)) return;
    
    selectedColors.set(colorKey, {
        hex: color,
        school: schoolName,
        type: colorType
    });
    
    updateSelectedColorsDisplay();
}

function updateSelectedColorsDisplay() {
    const selectedColorsDiv = document.getElementById('selectedColors');
    const format = document.getElementById('displayFormat').value;
    
    if (selectedColors.size === 0) {
        selectedColorsDiv.innerHTML = '<p class="no-selections">No colors selected yet. Click any color swatch to add it here.</p>';
        document.getElementById('copyAll').style.display = 'none';
        document.getElementById('clearAll').style.display = 'none';
        return;
    }

    selectedColorsDiv.innerHTML = '';
    selectedColors.forEach((data, key) => {
        const colorItem = document.createElement('div');
        colorItem.className = 'selected-color-item';
        
        const displayText = format === 'hex' 
            ? data.hex
            : `${data.school} - ${data.type} - ${data.hex}`;
        
        colorItem.innerHTML = `
            <div class="selected-color-swatch" style="background-color: ${data.hex}"></div>
            <span>${displayText}</span>
            <span class="selected-color-remove">×</span>
        `;

        colorItem.querySelector('.selected-color-remove').addEventListener('click', () => {
            selectedColors.delete(key);
            updateSelectedColorsDisplay();
        });

        selectedColorsDiv.appendChild(colorItem);
    });
    
    document.getElementById('copyAll').style.display = 'block';
    document.getElementById('clearAll').style.display = 'block';
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    initializeTheme();
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Add format change listener
    document.getElementById('displayFormat').addEventListener('change', updateSelectedColorsDisplay);

    // Add copy all functionality
    document.getElementById('copyAll').addEventListener('click', () => {
        const format = document.getElementById('displayFormat').value;
        const colorsList = Array.from(selectedColors.values())
            .map(data => format === 'hex' 
                ? data.hex
                : `${data.school} - ${data.type} - ${data.hex}`
            )
            .join('\n');
        
        navigator.clipboard.writeText(colorsList);
        showTooltip('All colors copied!', document.getElementById('copyAll'));
        setTimeout(hideTooltip, 2000);
    });

    // Add clear all functionality
    document.getElementById('clearAll').addEventListener('click', () => {
        selectedColors.clear();
        updateSelectedColorsDisplay();
    });
});

// Add this new function after the existing functions
function setupClipboardToggle() {
    const clipboardContainer = document.querySelector('.selected-colors-container');
    const toggleButton = document.querySelector('.clipboard-toggle');
    
    if (toggleButton && clipboardContainer) {
        toggleButton.setAttribute('aria-expanded', 'true');
        
        toggleButton.addEventListener('click', () => {
            clipboardContainer.classList.toggle('hidden');
            const isHidden = clipboardContainer.classList.contains('hidden');
            toggleButton.setAttribute('aria-expanded', !isHidden);
        });
    }
}

