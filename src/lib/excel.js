// Real .xlsx read/write (SheetJS) — used instead of CSV so descriptions with
// commas/newlines/quotes never need manual escaping, and the file opens
// directly and nicely in Excel/Google Sheets/Numbers.
//
// `xlsx` is a large library only needed by the admin's rarely-used bulk
// Excel edit page, so it's dynamically imported here rather than statically
// — a static import would bundle it into the main chunk every storefront
// visitor downloads, for a feature only superadmins use.

export async function downloadExcel(filename, rows, headers) {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
  XLSX.writeFile(workbook, filename);
}

export async function parseExcelFile(file) {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheetName];
  // defval ensures every row has every header key (even if blank), and
  // raw:false stringifies numbers/dates the same way a CSV cell would.
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
  // Normalize header keys to lowercase (json_to_sheet/sheet_to_json use the
  // header row text as-is) so lookups like row.short_desc are reliable
  // regardless of how the admin capitalized the column in Excel.
  return rows.map((row) => {
    const normalized = {};
    for (const key of Object.keys(row)) {
      normalized[key.trim().toLowerCase()] = typeof row[key] === "string" ? row[key].trim() : row[key];
    }
    return normalized;
  });
}
