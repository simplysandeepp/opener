# Opener - Technical Architecture

## 1. Tech Stack
- **Framework:** Flutter (Dart)
- **Target Platform:** Android (optimized for Samsung S23 Ultra)
- **State Management:** Provider (keeping it simple and effective).
- **UI System:** Material 3 (built-in Flutter).

## 2. Key Dependencies (pubspec.yaml)
- `shared_preferences`: To store the URI of the default selected folder persistently.
- `shared_storage` (or `file_picker` + `permission_handler`): To request persistent directory access via Android SAF.
- `flutter_markdown`: For rendering Markdown files in Read Mode.
- `webview_flutter`: For rendering HTML files.
- `path_provider`: For file system path utilities.

## 3. Directory Structure (Proposed)
```text
lib/
 ┣ core/               # Theme, constants, utility functions
 ┣ data/               # File access logic, SAF integrations
 ┣ models/             # Data models representing files/folders
 ┣ providers/          # State management providers
 ┣ views/
 ┃ ┣ onboarding/       # Directory selection screen
 ┃ ┣ explorer/         # File listing screen
 ┃ ┣ viewer/           # Screen to render HTML/MD/TXT
 ┃ ┗ editor/           # Screen to edit raw text
 ┗ main.dart           # App entry point
```

## 4. Android Specifics
- For modern Android (Android 11+ on S23 Ultra), we rely on `ACTION_OPEN_DOCUMENT_TREE` to get a persistent URI to a specific folder.
- We then use the `DocumentFile` API (via flutter plugins) to list, read, and write files without needing the overarching and restricted `MANAGE_EXTERNAL_STORAGE` permission.
