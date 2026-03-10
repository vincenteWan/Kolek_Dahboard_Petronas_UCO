// ==================== DATABASE API FUNCTIONS ====================
// Configuration
const API_BASE_URL = `${window.location.origin}/api`;

// Helper function for API calls with error handling
async function fetchFromAPI(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`✅ Loaded data from ${endpoint}:`, data.length, 'records');
        return data;
    } catch (error) {
        console.error(`❌ Error loading from ${endpoint}:`, error);
        return [];
    }
}

// Database loading functions (replacements for CSV loading)

// Load Household data from database
function loadHouseholdFromDatabase() {
    return fetchFromAPI('/household').then(data => {
        householdFullData = data;
        householdCurrentPage = 1;
        renderHouseholdPage(1);
        updateHouseholdKPI(data.length);
        if (typeof updateUcoKPIFromHouseholds === 'function') {
            updateUcoKPIFromHouseholds(data);
        }
        updateTop5RewardsLeaders(data);
        return data;
    }).catch(err => {
        console.error('Error loading household data:', err);
        return [];
    });
}

// Load Collector data from database
function loadCollectorFromDatabase() {
    return fetchFromAPI('/collector').then(data => {
        const mapped = (data || []).map(c => ({
            collectorID: c.collectorID || c.collectorId || c.collector_id || c.id || c.ID || '',
            collectorName: c.collectorName || c.collector_name || c.name || c.fullName || c.full_name || '',
            phoneNumber: c.phoneNumber || c.phone_number || c.phone || c.contactNumber || c.contact_number || '',
            emailAddress: c.emailAddress || c.email_address || c.email || '',
            dateOfBirth: c.dateOfBirth || c.date_of_birth || c.dob || c.birthDate || c.birth_date || '',
            vehicleType: c.vehicleType || c.vehicle_type || c.vehicle || '',
            vehiclePlateNumber: c.vehiclePlateNumber || c.vehicle_plate_number || c.plateNumber || c.plate_number || c.vehiclePlate || '',
            preferredCollectionArea: c.preferredCollectionArea || c.preferred_collection_area || c.preferredArea || c.preferred_area || '',
            availability: c.availability || c.available || c.availabilityStatus || c.availability_status || '',
            accountStatus: c.accountStatus || c.account_status || c.status || ''
        }));
        collectorFullData = mapped;
        collectorFilteredData = mapped.slice();
        console.log("Collector data loaded:", data.length, "records");
        collectorCurrentPage = 1;
        if (typeof applyCollectorFilters === 'function') {
            applyCollectorFilters();
        } else {
            renderCollectorPage(1);
        }
        updateCollectorKPI(data.length);
        return data;
    }).catch(err => {
        console.error('Error loading collector data:', err);
        return [];
    });
}

// Load Application data from database
function loadApplicationFromDatabase() {
    return fetchFromAPI('/application').then(data => {
        populateApplicantTableFromData(data);
        updateApplicantKPI(data.length);
        return data;
    }).catch(err => {
        console.error('Error loading application data:', err);
        return [];
    });
}

// Load Station data from database
function loadStationFromDatabase() {
    return fetchFromAPI('/station').then(data => {
        // Transform to expected format for station table
        const stations = data.map(s => {
            const fillLevel = parseFloat(s.fillLevel || '0');
            const rawStatus = String(
                s.fillStatus
                ?? s.fill_status
                ?? s.stationStatus
                ?? s.station_status
                ?? s.status
                ?? ''
            ).trim();

            const norm = rawStatus.toLowerCase();
            let status = '';
            if (norm === 'good' || norm === 'good condition') status = 'good';
            else if (norm === 'warning' || norm === 'nearly full') status = 'warning';
            else if (norm === 'danger' || norm === 'full bin') status = 'danger';

            if (!status) {
                status = 'good';
                if (fillLevel >= 90) status = 'danger';
                else if (fillLevel >= 70) status = 'warning';
            }
            
            return {
                id: '#' + (s.stationID || ''),
                name: s.stationName || '',
                location: s.stationLocation || '',
                fill: fillLevel,
                purity: 0, // Not in database, default to 0
                status: status,
                operationHour: s.operationHour || '',
                adminID: s.adminID || ''
            };
        });
        return stations;
    }).catch(err => {
        console.error('Error loading station data:', err);
        return [];
    });
}

// Load Campaign data from database
function loadCampaignFromDatabase() {
    return fetchFromAPI('/campaign').then(data => {
        populateAwarenessTable(data);
        return data;
    }).catch(err => {
        console.error('Error loading campaign data:', err);
        return [];
    });
}

// Load Admin data from database
function loadAdminFromDatabase() {
    return fetchFromAPI('/admin').catch(err => {
        console.error('Error loading admin data:', err);
        return [];
    });
}

// Load Reward data from database
function loadRewardFromDatabase() {
    return fetchFromAPI('/reward').catch(err => {
        console.error('Error loading reward data:', err);
        return [];
    });
}

// Load Report data from database
function loadReportFromDatabase() {
    return fetchFromAPI('/report').catch(err => {
        console.error('Error loading report data:', err);
        return [];
    });
}

// Load AccidentReport data from database
function loadAccidentReportFromDatabase() {
    return fetchFromAPI('/accidentreport').catch(err => {
        console.error('Error loading accident report data:', err);
        return [];
    });
}

// Load ManualReport data from database
function loadManualReportFromDatabase() {
    return fetchFromAPI('/manualreport').catch(err => {
        console.error('Error loading manual report data:', err);
        return [];
    });
}

// Load CollectionReport data from database

// Load Collection data from database
function loadCollectionFromDatabase() {
    return fetchFromAPI('/collection').then(data => {
        collectionFullData = Array.isArray(data) ? data.slice().sort((a, b) => {
            const aIdRaw = a.collectionID ?? a.collectionId ?? a.id ?? '';
            const bIdRaw = b.collectionID ?? b.collectionId ?? b.id ?? '';

            const aNum = parseInt(aIdRaw, 10);
            const bNum = parseInt(bIdRaw, 10);

            const aIsNum = !Number.isNaN(aNum);
            const bIsNum = !Number.isNaN(bNum);

            if (aIsNum && bIsNum) return aNum - bNum;
            if (aIsNum) return -1;
            if (bIsNum) return 1;

            return String(aIdRaw).localeCompare(String(bIdRaw));
        }) : [];
        collectionFilteredData = collectionFullData.slice();
        console.log("Collection data loaded:", data.length, "records");
        collectionCurrentPage = 1;
        renderCollectionPage(1);
        updateCollectionKPI(data.length);
        if (typeof updatePendingBadgeCount === 'function') {
            updatePendingBadgeCount();
        }
        if (typeof refreshUcoTrendChart === 'function') {
            refreshUcoTrendChart();
        }
        if (typeof refreshAreaChartFromCollections === 'function') {
            refreshAreaChartFromCollections();
        }
        return data;
    }).catch(err => {
        console.error('Error loading collection data:', err);
        return [];
    });
}

function loadCollectionReportFromDatabase() {
    return fetchFromAPI('/collectionreport').catch(err => {
        console.error('Error loading collection report data:', err);
        return [];
    });
}

// Load StationDeposit data from database
function loadStationDepositFromDatabase() {
    return fetchFromAPI('/stationdeposit').catch(err => {
        console.error('Error loading station deposit data:', err);
        return [];
    });
}

// Load RewardRedemption data from database
function loadRewardRedemptionFromDatabase() {
    return fetchFromAPI('/rewardredemption').catch(err => {
        console.error('Error loading reward redemption data:', err);
        return [];
    });
}

// Health check - verify database connection
async function checkDatabaseConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        console.log('🔗 Database connection status:', data);
        return data.status === 'ok';
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}

// ==================== OVERRIDE CSV FUNCTIONS WITH DATABASE VERSIONS ====================
// These override the original loadXXXFromCSV functions

// Override Household loading
const originalLoadHouseholdFromCSV = window.loadHouseholdFromCSV || function() { return Promise.resolve([]); };
window.loadHouseholdFromCSV = function(url) {
    // If URL parameter is provided (fallback to CSV), use original function
    if (url && url !== 'Fnl-Household.csv') {
        return originalLoadHouseholdFromCSV(url);
    }
    // Default: load from database
    return loadHouseholdFromDatabase();
};

// Override Collector loading
const originalLoadCollectorFromCSV = window.loadCollectorFromCSV || function() { return Promise.resolve([]); };
window.loadCollectorFromCSV = function(url) {
    if (url && url !== 'Fnl-Collector.csv') {
        return originalLoadCollectorFromCSV(url);
    }
    return loadCollectorFromDatabase();
};

// Override Application loading
const originalLoadApplicationFromCSV = window.loadApplicationFromCSV || function() { return Promise.resolve([]); };
window.loadApplicationFromCSV = function(url) {
    if (url && url !== 'Fnl-Application.csv') {
        return originalLoadApplicationFromCSV(url);
    }
    return loadApplicationFromDatabase();
};

// Override Station loading
const originalLoadStationFromCSV = window.loadStationFromCSV || function() { return Promise.resolve([]); };
window.loadStationFromCSV = function(url) {
    if (url && url !== 'Fnl-Station.csv') {
        return originalLoadStationFromCSV(url);
    }
    return loadStationFromDatabase();
};

// Override Campaign loading
const originalLoadCampaignFromCSV = window.loadCampaignFromCSV || function() { return Promise.resolve([]); };
window.loadCampaignFromCSV = function(url) {
    if (url && url !== 'Fnl-Campaign.csv') {
        return originalLoadCampaignFromCSV(url);
    }
    return loadCampaignFromDatabase();
};

console.log('✅ Database API functions loaded - will retrieve data from database instead of CSV files');
