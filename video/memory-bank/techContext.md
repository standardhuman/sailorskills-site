# Tech Context: BOATY

## Core Technologies
- **Backend:** Python 3.x, Flask (currently 2.0.1)
    - **Key Libraries:**
        - `google-api-python-client`: For YouTube Data API V3 interaction (uploads, playlists).
        - `google-auth-oauthlib`: For YouTube API OAuth2 authentication.
        - `Werkzeug` (currently 2.0.3, pinned): WSGI utility library for Flask.
- **Frontend:** HTML5, CSS3, JavaScript (ES6+ Vanilla JS)
- **Configuration:** JSON (`config.json`)
- **Version Control:** Git

## Development Setup
- **Virtual Environment:** Python virtual environment (e.g., `boaty_venv_new/`)
    - Dependencies managed via `requirements.txt`.
- **Launcher:** `launch_boaty.command` (macOS) and `launcher.py` for starting the Flask app.
- **IDE/Editor:** User's choice (current interaction via Cursor).

## Key Technical Constraints & Considerations
- **YouTube API Quotas:** Operations are subject to YouTube API quotas. Resumable uploads and efficient API calls are important.
- **Error Handling:** Robust error handling for API calls, file operations, and user inputs is critical.
- **Security:**
    - `client_secrets.json` (for OAuth) and `token.json` (OAuth token) are sensitive; `token.json` is gitignored.
    - Input validation for API endpoints.
    - Care in serving files (`send_file`) to prevent directory traversal.
- **Resumable Uploads:** Essential for handling large video files and potentially unstable connections. The Google API client library handles much of the complexity.
- **Concurrency:** Uploads run in a background thread in `app.py` to avoid blocking the main Flask process and UI.
    - Careful management of shared state (like `upload_status`) is necessary to prevent race conditions or errors like the `KeyError: 'paused'` previously encountered.

## Tool Usage Patterns
- **Git:** For version control, with a preference for Conventional Commits.
- **Flask Dev Server:** Used for local development (`app.run(debug=True)`).
- **Python `logging` module:**
    - Configured in `utils/logging.py`.
    - Default log level for console and file is `INFO`.
    - `DEBUG` level used for verbose, frequent messages (e.g., chunk upload progress, throttling details) to keep default console output clean. These are not visible unless the logger's level in `utils/logging.py` is changed to `DEBUG`.

## Dependencies (from `requirements.txt` - snippet, not exhaustive)
- Flask==2.0.1
- Werkzeug==2.0.3
- google-api-python-client
- google-auth-oauthlib
- google-auth-httplib2
- requests
- click
- itsdangerous
- Jinja2
- MarkupSafe

*Ensure `requirements.txt` is kept up to date with any changes.* 