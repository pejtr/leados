import { google } from "googleapis";

/**
 * Parses the GOOGLE_SERVICE_ACCOUNT_JSON env variable and returns a Google Auth client.
 */
function getAuthClient() {
  const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set");
  }
  const credentials = JSON.parse(json);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

/**
 * Extracts spreadsheet ID from a Google Sheets URL or raw ID string.
 * Supports:
 *   - https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
 *   - https://docs.google.com/spreadsheets/d/SPREADSHEET_ID
 *   - Raw SPREADSHEET_ID
 */
export function extractSpreadsheetId(input: string): string {
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  // Assume it's a raw ID if it looks like one
  if (/^[a-zA-Z0-9-_]{20,}$/.test(input.trim())) return input.trim();
  throw new Error("Invalid Google Sheets URL or ID: " + input);
}

export interface SheetLead {
  companyName: string;
  email: string;
  website: string;
  industry: string;
  location: string;
  companySize: string;
  seniorityLevel: string;
  icebreaker: string;
  status: string;
  qualityRating: string;
  dealValue: number | null;
  dataSource: string;
  createdAt: Date;
}

const HEADERS = [
  "Company Name",
  "Email",
  "Website",
  "Industry",
  "Location",
  "Company Size",
  "Seniority Level",
  "AI Icebreaker",
  "Status",
  "Quality Rating",
  "Deal Value",
  "Data Source",
  "Created At",
];

/**
 * Exports leads to a Google Sheet.
 * - If the sheet is empty, writes headers first.
 * - Appends lead rows after existing data.
 * Returns the number of rows written.
 */
export async function exportLeadsToSheet(
  spreadsheetId: string,
  sheetName: string = "Leads",
  leads: SheetLead[]
): Promise<{ rowsWritten: number; sheetUrl: string }> {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  // Check if the target sheet exists; create it if not
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const existingSheets = spreadsheet.data.sheets?.map((s) => s.properties?.title) ?? [];

  if (!existingSheets.includes(sheetName)) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: { title: sheetName },
            },
          },
        ],
      },
    });
  }

  // Check if the sheet already has data (to decide whether to write headers)
  const range = `${sheetName}!A1:A1`;
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  const hasData = (existing.data.values?.length ?? 0) > 0;

  // Build rows
  const rows: (string | number | null)[][] = [];
  if (!hasData) {
    rows.push(HEADERS);
  }

  for (const lead of leads) {
    rows.push([
      lead.companyName ?? "",
      lead.email ?? "",
      lead.website ?? "",
      lead.industry ?? "",
      lead.location ?? "",
      lead.companySize ?? "",
      lead.seniorityLevel ?? "",
      lead.icebreaker ?? "",
      lead.status ?? "new",
      lead.qualityRating ?? "",
      lead.dealValue ?? "",
      lead.dataSource ?? "",
      lead.createdAt ? new Date(lead.createdAt).toISOString() : "",
    ]);
  }

  // Append rows
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A1`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows },
  });

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  return { rowsWritten: leads.length, sheetUrl };
}
