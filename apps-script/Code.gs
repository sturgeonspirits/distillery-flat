const SECRET_PROPERTY_NAMES = [
  "GOOGLE_APPS_SCRIPT_SECRET",
  "APP_BACKEND_SECRET",
];

const SPREADSHEET_ID_PROPERTY_NAMES = [
  "GOOGLE_SHEETS_SPREADSHEET_ID",
  "SPREADSHEET_ID",
];

function doGet() {
  return json_({
    ok: true,
    data: {
      service: "sturgeon-flat-sheets-backend",
    },
  });
}

function doPost(e) {
  try {
    const payload = JSON.parse((e.postData && e.postData.contents) || "{}");
    const expectedSecret = getFirstScriptProperty_(SECRET_PROPERTY_NAMES);

    if (!expectedSecret) {
      throw new Error(
        "Missing script property GOOGLE_APPS_SCRIPT_SECRET.",
      );
    }

    if (!payload.secret || payload.secret !== expectedSecret) {
      throw new Error("Unauthorized.");
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      return json_({
        ok: true,
        data: handleOperation_(payload),
      });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return json_({
      ok: false,
      error: error && error.message ? error.message : String(error),
    });
  }
}

function handleOperation_(payload) {
  const spreadsheet = getSpreadsheet_(payload);

  switch (payload.operation) {
    case "metadata":
      return getMetadata_(spreadsheet);
    case "batchUpdate":
      return batchUpdate_(spreadsheet, payload.requests || []);
    case "getValues":
      return {
        values: getValues_(spreadsheet, payload.range),
      };
    case "updateValues":
      updateValues_(spreadsheet, payload.range, payload.values || []);
      return {};
    case "clearValues":
      clearValues_(spreadsheet, payload.range);
      return {};
    default:
      throw new Error("Unsupported operation: " + payload.operation);
  }
}

function getSpreadsheet_(payload) {
  const spreadsheetId =
    getFirstScriptProperty_(SPREADSHEET_ID_PROPERTY_NAMES);

  if (spreadsheetId) {
    return SpreadsheetApp.openById(spreadsheetId);
  }

  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (!activeSpreadsheet) {
    if (payload.spreadsheetId) {
      return SpreadsheetApp.openById(payload.spreadsheetId);
    }

    throw new Error("Set GOOGLE_SHEETS_SPREADSHEET_ID as a script property.");
  }

  return activeSpreadsheet;
}

function getMetadata_(spreadsheet) {
  return {
    sheets: spreadsheet.getSheets().map(function (sheet) {
      return {
        properties: {
          sheetId: sheet.getSheetId(),
          title: sheet.getName(),
        },
      };
    }),
  };
}

function batchUpdate_(spreadsheet, requests) {
  requests.forEach(function (request) {
    if (!request.addSheet || !request.addSheet.properties) {
      throw new Error("Only addSheet batchUpdate requests are supported.");
    }

    const title = request.addSheet.properties.title;

    if (!title) {
      throw new Error("addSheet.properties.title is required.");
    }

    if (!spreadsheet.getSheetByName(title)) {
      spreadsheet.insertSheet(title);
    }
  });

  SpreadsheetApp.flush();
  return {};
}

function getValues_(spreadsheet, range) {
  const parsed = parseRange_(range);
  const sheet = spreadsheet.getSheetByName(parsed.sheetName);

  if (!sheet) {
    return [];
  }

  const lastRow = parsed.endRow || sheet.getLastRow();
  const numRows = Math.max(0, lastRow - parsed.startRow + 1);
  const numCols = parsed.endCol - parsed.startCol + 1;

  if (numRows === 0 || numCols === 0) {
    return [];
  }

  return sheet
    .getRange(parsed.startRow, parsed.startCol, numRows, numCols)
    .getValues();
}

function updateValues_(spreadsheet, range, values) {
  if (!values.length) {
    return;
  }

  const parsed = parseRange_(range);
  const sheet = getOrCreateSheet_(spreadsheet, parsed.sheetName);
  const numRows = values.length;
  const numCols = parsed.endCol - parsed.startCol + 1;

  ensureSheetSize_(sheet, parsed.startRow + numRows - 1, parsed.endCol);

  sheet
    .getRange(parsed.startRow, parsed.startCol, numRows, numCols)
    .setValues(normalizeValues_(values, numCols));

  SpreadsheetApp.flush();
}

function clearValues_(spreadsheet, range) {
  const parsed = parseRange_(range);
  const sheet = spreadsheet.getSheetByName(parsed.sheetName);

  if (!sheet) {
    return;
  }

  const lastRow = parsed.endRow || sheet.getLastRow();
  const numRows = Math.max(0, lastRow - parsed.startRow + 1);
  const numCols = parsed.endCol - parsed.startCol + 1;

  if (numRows === 0 || numCols === 0) {
    return;
  }

  sheet
    .getRange(parsed.startRow, parsed.startCol, numRows, numCols)
    .clearContent();

  SpreadsheetApp.flush();
}

function normalizeValues_(values, numCols) {
  return values.map(function (row) {
    const output = row.slice(0, numCols);

    while (output.length < numCols) {
      output.push("");
    }

    return output;
  });
}

function getOrCreateSheet_(spreadsheet, sheetName) {
  return spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
}

function ensureSheetSize_(sheet, minRows, minCols) {
  const currentRows = sheet.getMaxRows();
  const currentCols = sheet.getMaxColumns();

  if (currentRows < minRows) {
    sheet.insertRowsAfter(currentRows, minRows - currentRows);
  }

  if (currentCols < minCols) {
    sheet.insertColumnsAfter(currentCols, minCols - currentCols);
  }
}

function parseRange_(range) {
  if (!range) {
    throw new Error("Range is required.");
  }

  const bangIndex = range.lastIndexOf("!");

  if (bangIndex < 0) {
    throw new Error("Range must include a sheet name.");
  }

  const sheetName = unquoteSheetName_(range.slice(0, bangIndex));
  const rangePart = range.slice(bangIndex + 1);
  const parts = rangePart.split(":");
  const start = parseCellRef_(parts[0]);
  const end = parseCellRef_(parts[1] || parts[0]);

  return {
    sheetName: sheetName,
    startRow: start.row || 1,
    startCol: start.col,
    endRow: end.row || null,
    endCol: end.col,
  };
}

function unquoteSheetName_(value) {
  if (value[0] === "'" && value[value.length - 1] === "'") {
    return value.slice(1, -1).replace(/''/g, "'");
  }

  return value;
}

function parseCellRef_(value) {
  const match = String(value || "").match(/^([A-Z]+)(\d+)?$/i);

  if (!match) {
    throw new Error("Invalid A1 range reference: " + value);
  }

  return {
    col: columnToNumber_(match[1]),
    row: match[2] ? Number(match[2]) : null,
  };
}

function columnToNumber_(letters) {
  return letters
    .toUpperCase()
    .split("")
    .reduce(function (sum, letter) {
      return sum * 26 + letter.charCodeAt(0) - 64;
    }, 0);
}

function getFirstScriptProperty_(names) {
  const properties = PropertiesService.getScriptProperties();

  for (let index = 0; index < names.length; index += 1) {
    const value = properties.getProperty(names[index]);

    if (value) {
      return value;
    }
  }

  return "";
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
