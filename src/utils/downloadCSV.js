export function downloadCSV(filename, rows) {
  const headers = ["Date", "Métrage (m)", "Type"];
  const csvRows = [headers, ...(rows || []).map((r) => [r.date, r.distance, r.type])];

  const csv = csvRows
    .map((r) => r.map((c) => `"${String(c ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "export.csv";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
