# Opener - Development Tracker

## Status Key
- [ ] Not Started
- [~] In Progress
- [x] Completed

## Phase 1: Foundation & Setup
- [x] Create project documentation (PRD, Architecture, Tracker).
- [~] Initialize Flutter project.
- [ ] Set up `.gitignore` to exclude `docs/`.
- [ ] Clean up default Flutter counter app.
- [ ] Add basic Material 3 theme and constants.

## Phase 2: Storage Access & Onboarding
- [ ] Integrate SAF library (`shared_storage` or similar).
- [ ] Build Onboarding Screen with "Select Folder" button.
- [ ] Implement persistent URI saving (so user doesn't pick folder every time).

## Phase 3: File Explorer
- [ ] Build recursive folder reading logic using DocumentFile APIs.
- [ ] Build Explorer UI (List of folders/files with Material icons).
- [ ] Implement navigation stack (go deep into folders and back out).

## Phase 4: Viewers (Read Mode)
- [ ] Integrate Markdown renderer for `.md`.
- [ ] Integrate WebView for `.html`.
- [ ] Implement rotation prompt logic for HTML.
- [ ] Simple Text View for `.txt` and `.csv`.

## Phase 5: Editor (Edit Mode)
- [ ] Build toggle logic between Read / Edit view.
- [ ] Implement TextField with code-like properties (monospace font, no autocorrect).
- [ ] Implement Save functionality to overwrite the original file via SAF.
