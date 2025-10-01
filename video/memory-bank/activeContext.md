# Active Context: BOATY

## Current Work Focus
- Debugging and stabilizing the YouTube video upload process.
- Ensuring progress is correctly reported to the UI and that uploads complete successfully.

## Recent Changes
- **YouTube Upload Stability:**
    - Resolved `KeyError: 'paused'` in `app.py` by ensuring full initialization of the `upload_status` dictionary when starting uploads (`/api/upload-videos`) and when clearing status (`/api/clear-upload-status`). This was causing the upload thread to crash.
    - Refined YouTube API throttling logic in `utils/youtube_api.py` for more accurate rate calculations and to prevent excessive, incorrect delays.
    - Added detailed logging to `utils/youtube_api.py` to trace chunk uploads, status objects, and retry attempts.
    - Added progress callback logging in `app.py` (`update_progress_callback`) to monitor how the global `upload_status` (polled by the UI) is updated.
    - **Adjusted Logging Levels:** Changed frequent, verbose logs (per-chunk progress in `utils/youtube_api.py`, `update_progress_callback` in `app.py`, and throttling details) from `INFO` to `DEBUG` level to make the console output cleaner during normal operation. Key events (upload start/finish, errors) remain at `INFO` or `ERROR`.
- **Previous (before this upload debugging session):**
    - Dependency Fix: Pinned `Werkzeug==2.0.3`.
    - Configuration Fix: Corrected directory paths in `config.json`.
    - JavaScript Fixes: Resolved various `ReferenceError`s.
    - Launcher Script Fix: Updated venv path.
    - Temporary Workaround: Modified `utils/file_operations.py::rename_videos` (still active, to be reverted).

## Next Steps
- **Revert Temporary Workaround:** Remove the modification made to `utils/file_operations.py::rename_videos` that bypasses the "no source videos" error, as the upload functionality seems stable.
- **User Testing:** Conduct a full end-to-end test of the renaming and upload workflow.
- **UI/UX Enhancements (Planned, from `tasks.md`):**
    - Further improve real-time upload progress display in the UI (though backend reporting is now good).
    - Make video thumbnails smaller and more compact.
    - Group videos by boat in the UI.
    - Redesign the upload preview (dry run) section.
- Review `tasks.md` for other backlog items.

## Active Decisions & Considerations
- Balancing logging verbosity with diagnostic capability is important. Defaulting to cleaner output (INFO) while having DEBUG logs available is a good compromise.
- The temporary workaround in `file_operations.py` is next on the list to be removed.

## Important Patterns & Preferences
- Iterative debugging with targeted logging is effective.
- Ensuring shared state objects (`upload_status`) are consistently initialized is critical in multi-threaded applications.
- API calls for resumable uploads involve a loop of `next_chunk()` calls, where `status` is `MediaUploadProgress` until the final chunk, when `status` becomes `None` and `response` contains the video details.

## Learnings & Project Insights
- `KeyError` exceptions can halt background threads silently if not caught or if state is not managed carefully.
- Accurate calculation of bytes processed per time interval is key for effective upload throttling.
- The Google API client library for resumable uploads returns `None` for the `response` object until the very last chunk is uploaded. The `status` object provides interim progress.
- Uploads are now completing successfully, and progress reporting appears to be working correctly.
