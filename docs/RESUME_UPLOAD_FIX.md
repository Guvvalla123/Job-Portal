# Resume PDF Preview Fix – Root Cause & Solution

## Problem

Resume upload worked, but when clicking "View" or "Preview":
- The file downloaded
- Opened file showed garbled/unreadable text (e.g. Japanese-like characters)

## Root Cause

**Binary data corruption during Cloudinary upload.**

The original implementation used `streamifier.createReadStream(fileBuffer).pipe(uploadStream)` to upload PDFs. Piping binary data through Node.js streams can corrupt it when:

1. **Stream encoding** – Streams may treat data as UTF-8 text, altering binary bytes
2. **Buffer handling** – Some stream implementations mishandle binary buffers
3. **Cloudinary `upload_stream`** – Stream-based upload can introduce encoding issues for raw binary files

## Why Binary Files Show Garbled Text

PDFs are binary. If bytes are interpreted as UTF-8:

- Invalid UTF-8 sequences become replacement characters (e.g. `�`)
- Multi-byte sequences can look like CJK characters
- The file structure is broken and no longer a valid PDF

## Solution Implemented

### Backend: Base64 Data URI Upload

Switched from stream-based upload to **base64 data URI** upload, which Cloudinary supports and preserves binary integrity:

```javascript
// Before (corrupts binary)
streamifier.createReadStream(fileBuffer).pipe(uploadStream);

// After (preserves binary)
const base64 = fileBuffer.toString("base64");
const dataUri = `data:${mimetype};base64,${base64}`;
cloudinary.uploader.upload(dataUri, {
  folder: "job-portal/resumes",
  resource_type: "raw",
  public_id: `resume-${userId}-${Date.now()}.${ext}`,
});
```

### Changes

1. **`uploadResumeToCloudinary`** – Uses base64 data URI instead of streams
2. **`public_id` with extension** – e.g. `resume-123-456.pdf` so Cloudinary serves with correct `Content-Type`
3. **`secure_url`** – Still stored in the database; frontend uses it directly
4. **Profile images** – Use `uploadStream.end(fileBuffer)` (Cloudinary’s recommended buffer pattern) instead of streamifier

### Frontend

- Direct links to Cloudinary `secure_url` with `target="_blank"` and `rel="noopener noreferrer"`
- No API fetch; browser loads the PDF from Cloudinary
- Optional "Download" link with `download="resume.pdf"` for explicit download

## Verification

1. Upload a new PDF resume (old ones may still be corrupted)
2. Click "View" – PDF should open in the browser or download correctly
3. Open the file – content should be readable

## If Using Backend Proxy Instead of Cloudinary URL

If you ever serve the file through your backend:

```javascript
// Backend – correct headers
res.setHeader("Content-Type", "application/pdf");
res.setHeader("Content-Disposition", "inline; filename=resume.pdf");
res.send(pdfBuffer);

// Frontend – fetch as blob
const response = await fetch(url, { responseType: "blob" });
const blob = await response.blob();
const url = URL.createObjectURL(blob);
window.open(url);
```

## Dependencies

- `streamifier` is no longer used for resume upload; it can be removed if unused elsewhere.
