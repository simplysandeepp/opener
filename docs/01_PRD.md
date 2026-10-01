# Opener - Product Requirements Document (PRD)

## 1. Overview
**Opener** is a minimalist, offline-first mobile application designed to manage, view, and edit a large volume (500+) of local files including HTML, Markdown (.md), Text (.txt), and CSV files. 

## 2. Target Audience & Use Case
- **Primary User:** Solo user managing hundreds of project files, PRDs, and HTML designs on a Samsung Galaxy S23 Ultra.
- **Core Problem:** Needs a fast, native-feeling, ad-free, local app to browse a specific directory tree and properly render/edit specific file types without relying on multiple different apps.

## 3. Key Features
1. **Default Directory Selection:** 
   - On first launch, the user selects a root folder via Android Storage Access Framework (SAF).
   - App remembers this path and opens directly to this directory tree on subsequent launches.
2. **File Explorer:**
   - Clean, text/icon-only interface (no images, relying on Flutter native icons and typography).
   - List folders and supported files.
   - Tap folder to navigate in, back button to navigate up.
3. **Smart Viewers (Read Mode):**
   - **.html:** Renders in a WebView. Shows a prompt to "Rotate device" if a PC-layout is detected or by default for HTML.
   - **.md:** Renders parsed Markdown (headers, lists, bold, etc.).
   - **.txt / .csv:** Renders as plain text.
4. **Editor (Edit Mode):**
   - Toggle button in the app bar to switch between Read and Edit modes.
   - Edit mode presents a raw text editor for the file content.
   - Save button to overwrite the local file.

## 4. Design Guidelines
- **Strictly Minimalist:** No images. Use typography (Google Fonts/system fonts) and pre-built icons (Material/Cupertino).
- **Theme:** Clean dark/light mode depending on system settings. Focus on readability.
