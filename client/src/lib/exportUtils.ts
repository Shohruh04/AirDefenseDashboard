import type { Alert, Aircraft } from "./simulation";

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV content
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Handle nested objects
          if (typeof value === "object" && value !== null) {
            return JSON.stringify(value).replace(/,/g, ";");
          }
          // Escape commas in strings
          return typeof value === "string" && value.includes(",")
            ? `"${value}"`
            : value;
        })
        .join(",")
    ),
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${filename}_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportAlertsToPDF(alerts: Alert[]) {
  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Alerts Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
        }
        h1 {
          color: #333;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 10px;
        }
        .meta {
          margin: 20px 0;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #3b82f6;
          color: white;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
        .priority-high {
          color: #ef4444;
          font-weight: bold;
        }
        .priority-medium {
          color: #f59e0b;
          font-weight: bold;
        }
        .priority-low {
          color: #10b981;
        }
      </style>
    </head>
    <body>
      <h1>Air Defense Simulation - Alerts Report</h1>
      <div class="meta">
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Alerts:</strong> ${alerts.length}</p>
        <p><strong>Educational Simulation:</strong> All data is artificially generated</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Type</th>
            <th>Priority</th>
            <th>Message</th>
            <th>Position</th>
          </tr>
        </thead>
        <tbody>
          ${alerts
            .map(
              (alert) => `
            <tr>
              <td>${new Date(alert.timestamp).toLocaleString()}</td>
              <td>${alert.type}</td>
              <td class="priority-${alert.priority.toLowerCase()}">${
                alert.priority
              }</td>
              <td>${alert.message}</td>
              <td>${
                alert.position
                  ? `${alert.position.lat.toFixed(
                      2
                    )}°, ${alert.position.lng.toFixed(2)}°`
                  : "N/A"
              }</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Open in new window for printing to PDF
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

export function exportAnalyticsToPDF(data: {
  detectionsPerMinute: number[];
  altitudeDistribution: { altitude: number; count: number }[];
  systemLoad: number[];
  aircraft: Aircraft[];
}) {
  const avgDetections =
    data.detectionsPerMinute.reduce((a, b) => a + b, 0) /
    data.detectionsPerMinute.length;
  const avgSystemLoad =
    data.systemLoad.reduce((a, b) => a + b, 0) / data.systemLoad.length;
  const avgAltitude =
    data.aircraft.reduce((sum, ac) => sum + ac.position.altitude, 0) /
    (data.aircraft.length || 1);
  const avgSpeed =
    data.aircraft.reduce((sum, ac) => sum + ac.speed, 0) /
    (data.aircraft.length || 1);

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Analytics Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
        }
        h1, h2 {
          color: #333;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 10px;
        }
        .meta {
          margin: 20px 0;
          color: #666;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin: 20px 0;
        }
        .stat-card {
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 8px;
          background: #f9fafb;
        }
        .stat-value {
          font-size: 24px;
          font-weight: bold;
          color: #3b82f6;
          margin: 10px 0;
        }
        .stat-label {
          color: #666;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        th {
          background-color: #3b82f6;
          color: white;
        }
        tr:nth-child(even) {
          background-color: #f9fafb;
        }
      </style>
    </head>
    <body>
      <h1>Air Defense Simulation - Analytics Report</h1>
      <div class="meta">
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Educational Simulation:</strong> All data is artificially generated</p>
      </div>

      <h2>Summary Statistics</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Average Detections/Minute</div>
          <div class="stat-value">${avgDetections.toFixed(1)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Average System Load</div>
          <div class="stat-value">${avgSystemLoad.toFixed(1)}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Average Altitude</div>
          <div class="stat-value">${avgAltitude.toFixed(0)}m</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Average Speed</div>
          <div class="stat-value">${avgSpeed.toFixed(0)} km/h</div>
        </div>
      </div>

      <h2>Altitude Distribution</h2>
      <table>
        <thead>
          <tr>
            <th>Altitude (m)</th>
            <th>Aircraft Count</th>
          </tr>
        </thead>
        <tbody>
          ${data.altitudeDistribution
            .map(
              (item) => `
            <tr>
              <td>${item.altitude}</td>
              <td>${item.count}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <h2>Current Aircraft Tracking</h2>
      <table>
        <thead>
          <tr>
            <th>Callsign</th>
            <th>Type</th>
            <th>Threat Level</th>
            <th>Altitude (m)</th>
            <th>Speed (km/h)</th>
          </tr>
        </thead>
        <tbody>
          ${data.aircraft
            .map(
              (ac) => `
            <tr>
              <td>${ac.callsign}</td>
              <td>${ac.type}</td>
              <td>${ac.threatLevel}</td>
              <td>${ac.position.altitude}</td>
              <td>${ac.speed}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
