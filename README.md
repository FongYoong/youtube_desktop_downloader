
## YouTube Desktop Downloader
### Installation
* Download [[⭳ Windows]](https://github.com/FongYoong/youtube_desktop_downloader/releases/latest/download/YouTube_Desktop_Downloader_x64.msi)
* No releases for MacOS and Linux yet

### Description
* A **desktop app** to download **video/audio/playlists** from YouTube and other [supported sites](https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md).
* Supports **multiple** concurrent downloads
* It saves download history, provides selection of format and resolution, and supports download cancellation.
* Displays a system tray icon for fun.
* Built with [Tauri](https://github.com/tauri-apps/tauri), a cross-platform framework for developing desktop apps and a lighter WebView-based alternative to [Electron.js](https://www.electronjs.org/).
* Credits to [yt-dlp](https://github.com/yt-dlp/yt-dlp), a command-line utility for downloading from YouTube

### Screenshots
* Main view
    ![home](https://i.imgur.com/G7p3iLk.png)
* Video info
    ![video](https://i.imgur.com/fMG9Tn3.png)
* Playlist info
    ![playlist](https://i.imgur.com/OsktnYi.png)


### Development
* `cargo tauri dev` to run a dev version of the app.
* `cargo tauri icon ./icons/app-icon.png` to generate icons from a single `app-icon.png` file.

### Deployment
* `cargo tauri build` to generate a release build.
* [Tauri guide](https://tauri.app/v1/guides/building/windows)

### To-do
* Add pause/resume download feature
* Build and test app on MacOS and Linux
* Include yt-dlp and FFMPEG binaries for MacOS and Linux