/*
  GOOGLE APPS SCRIPT SETUP

  1. Create a Google Sheet.
  2. Rename the first sheet to "Responses".
  3. Put these headers in row 1:
     Timestamp | Name | Phone Number | Class | Photo

  4. In the Sheet: Extensions -> Apps Script.
  5. Replace the default code with this file.
  6. Change FOLDER_ID below to your Google Drive folder ID.
     Create a Drive folder for student photos and copy the ID from its URL.
  7. Deploy -> New deployment -> Web app
       Execute as: Me
       Who has access: Anyone
     Copy the Web App URL into config.js.
*/
const FOLDER_ID = "1DWj9hxjwG4nL3-2KZ42rwdTGHXXFrcEM";

function doGet() {
  return ContentService
    .createTextOutput("Student Registration API is working!");
}

function doPost(e) {
  try {
    const sheet = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName("Responses");

    if (!sheet) {
      throw new Error('Sheet "Responses" was not found.');
    }

    const p = e.parameter || {};

    const name = String(p.name || "").trim();
    const phone = String(p.phone || "").trim();
    const studentClass = String(p.class || "").trim();
    const base64 = String(p.photoBase64 || "");
    const mimeType = String(p.photoMimeType || "image/jpeg");
    const originalName = String(p.photoName || "student-photo");

    if (!name || !phone || !studentClass || !base64) {
      throw new Error("Missing required fields.");
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(mimeType)) {
      throw new Error("Invalid image type.");
    }

    const bytes = Utilities.base64Decode(base64);

    if (bytes.length > 2 * 1024 * 1024) {
      throw new Error("Image is larger than 2 MB.");
    }

    const folder = DriveApp.getFolderById(FOLDER_ID);

    const extension =
      mimeType === "image/png" ? ".png" :
      mimeType === "image/webp" ? ".webp" :
      ".jpg";

    const safeName =
      originalName.replace(/[^a-zA-Z0-9._-]/g, "_");

    const fileName =
      new Date().getTime() + "_" + safeName;

    const blob = Utilities.newBlob(
      bytes,
      mimeType,
      fileName
    );

    const file = folder.createFile(blob);

    sheet.appendRow([
      new Date(),
      name,
      phone,
      studentClass,
      file.getUrl()
    ]);

    return ContentService
      .createTextOutput(
        JSON.stringify({
          success: true
        })
      )
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {

    return ContentService
      .createTextOutput(
        JSON.stringify({
          success: false,
          error: String(err)
        })
      )
      .setMimeType(ContentService.MimeType.JSON);
  }
}
