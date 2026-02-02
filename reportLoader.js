// Report Page DB Integration
var allReportData = [];
var reportCurrentPage = 1;
var reportRowsPerPage = 10;

async function loadReportTableFromDatabase() {
  console.log("Loading reports...");
  try {
    var response = await fetch("http://localhost:3001/api/report");
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
    var dt = r.dateTime ? new Date(r.dateTime) : null;
    var dateStr = dt ? dt.toLocaleDateString("en-GB") + " " + dt.toLocaleTimeString("en-US", {hour:"numeric",minute:"2-digit",hour12:true}) : "";
    var status = r.status || "Pending Review";
    var cls = status.toLowerCase().includes("resolved") ? "resolved" : "pending";
    row.innerHTML = "<td>#"+r.reportID+"</td><td>#"+r.collectorID+"</td><td>"+dateStr+"</td><td>"+r.reportType+"</td><td class=status_"+cls+">"+status+"</td><td class=actions-col><a href=# class=view-details>[View]</a></td>";
    row.dataset.reportData = JSON.stringify(r);
    tbody.appendChild(row);
  });
}

window.loadReportFromDatabase = loadReportTableFromDatabase;
console.log("Report loader ready");
