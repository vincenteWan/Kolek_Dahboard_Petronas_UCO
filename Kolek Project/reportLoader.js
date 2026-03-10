// Report Page DB Integration
var allReportData = [];
var reportCurrentPage = 1;
var reportRowsPerPage = 10;

function pickReportField(obj, keys, fallback) {
  if (!obj) return fallback || '';
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
  }
  return fallback || '';
}

function formatReportId(value) {
  if (value === undefined || value === null) return '';
  var str = String(value).trim();
  if (!str) return '';
  return str.startsWith('#') ? str : '#' + str;
}

function formatReportDateTime(value) {
  if (!value) return '';
  var dt = new Date(value);
  if (!isNaN(dt)) {
    return dt.toLocaleDateString('en-GB') + ' ' + dt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  return String(value);
}

async function loadReportTableFromDatabase() {
  console.log("Loading reports...");
  try {
    var response = await fetch(`${window.location.origin}/api/report`, { cache: 'no-store' });
    allReportData = await response.json();
    console.log("Loaded " + allReportData.length + " reports");
    populateReportTable(allReportData);
    return allReportData;
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
}

function populateReportTable(data) {
  var tbody = document.querySelector(".report-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  var start = (reportCurrentPage - 1) * reportRowsPerPage;
  var pageData = data.slice(start, start + reportRowsPerPage);
  if (pageData.length === 0) {
    tbody.innerHTML = "<tr><td colspan=6>No reports</td></tr>";
    return;
  }
  pageData.forEach(function(r) {
    var row = document.createElement("tr");
    var reportId = formatReportId(pickReportField(r, ['reportID','reportId','id','report_id'], ''));
    var collectorId = formatReportId(pickReportField(r, ['collectorID','collectorId','collector_id','collector'], ''));
    var dateStr = formatReportDateTime(pickReportField(r, ['dateTime','reportDateTime','reportDate','date','createdAt'], ''));
    var reportType = pickReportField(r, ['reportType','type','report_type','categoryType'], '');
    var status = pickReportField(r, ['status','Status','reportStatus','report_status'], 'Pending');
    var statusLower = String(status).toLowerCase();
    var cls = (statusLower.includes("reviewed") || statusLower.includes("resolved")) ? "reviewed" : "pending";
    // Use space-separated classes for status to match CSS selectors and render a light-green pill button
    row.innerHTML = "<td>"+reportId+"</td><td>"+collectorId+"</td><td>"+dateStr+"</td><td>"+reportType+"</td><td class=\"status " + cls + "\">"+status+"</td><td class=\"actions-col\"><span class=\"action-group\"><button class=\"view-details view-action\" aria-label=\"View details\">View details</button></span></td>";
    row.dataset.reportData = JSON.stringify(r);
    tbody.appendChild(row);
  });
}

window.loadReportFromDatabase = loadReportTableFromDatabase;
console.log("Report loader ready");
