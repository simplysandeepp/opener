# Privacy Policy for Opener

_Last updated: October 2026_

Opener is a local, offline-first file viewer and editor for Android. This page explains what data
the app accesses and when, in plain language.

## Your files stay on your device by default

Opener accesses files and folders you explicitly select, using Android's Storage Access
Framework. File contents are read and written locally on your device. Opener does not upload,
transmit, or share your file contents with anyone, unless you explicitly use one of the optional
features described below.

## Optional: AI features (powered by Groq)

AI features are **off by default**. If you turn them on and add your own Groq API key:

- The text of a file you're viewing, or a passage you select, is sent to Groq's API
  (`api.groq.com`) only when you explicitly ask a question or request an action (summarize,
  rewrite, translate, etc.).
- Your Groq API key is stored locally on your device using Android's secure keystore
  (via `expo-secure-store`). It is never sent to Opener's developer or any third party other than
  Groq itself, as part of your own API requests.
- You can turn AI features off, or remove your key, at any time in Settings.

See [Groq's own privacy policy](https://groq.com/privacy-policy/) for how they handle data sent
to their API.

## Optional: Google Drive backup

Google Drive sync is **off by default** and requires you to sign in with your own Google account.
If you connect it:

- Opener requests the `drive.file` OAuth scope, meaning it can only access files and folders it
  creates itself — never the rest of your Google Drive.
- It creates a folder named "Opener" in your Drive and stores: your favorites and recent-files
  list, app preferences (theme, AI settings), and copies of files you explicitly choose to back up
  (for example, starred files).
- Your Groq API key is **never** included in any Drive backup.
- You can disconnect at any time in Settings; disconnecting stops future syncing but does not
  delete what's already in your Drive (you can delete the "Opener" folder yourself at any time).

## What we don't do

- No analytics, no advertising, no tracking SDKs.
- No account system of our own — the only sign-in is Google's, and only if you choose to use Drive
  backup.
- No data is sold or shared with third parties beyond what's described above (Groq, if you enable
  AI; Google Drive, if you enable backup — both entirely at your choice and under your own
  accounts).

## Contact

For privacy questions about Opener, please [open an issue on GitHub](https://github.com/simplysandeepp/opener/issues).
