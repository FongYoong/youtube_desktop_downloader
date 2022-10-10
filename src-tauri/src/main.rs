#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;
use tauri::Manager;
pub mod menu_lib;
use menu_lib::{generate_menu, on_menu_event};
pub mod tray_lib;
use tray_lib::{generate_tray, on_tray_event};
pub mod download_lib;
use download_lib::{DownloadParameters, DownloadProcess};

#[tauri::command]
async fn download(app_handle: tauri::AppHandle, download_parameters: DownloadParameters) -> Result<String, String> {
    println!("{:?}", download_parameters);
    match DownloadProcess::download(app_handle, &download_parameters).await {
        Ok(_) => {
            Ok(format!("[Download Complete] {}", download_parameters.link))
        }
        Err(e) => {
            Err(format!("[Download Error] {:?}", e))
        }
    }
    
}

#[tauri::command]
async fn open_explorer(app_handle: tauri::AppHandle, path: String, is_playlist: bool) {
    if cfg!(target_os = "windows") {
        let args = if is_playlist {vec![path.as_str()]} else {vec!["/select,", path.as_str()]};
        Command::new("explorer")
        .args(args)
        .spawn()
        .unwrap();
    } else {
        // Add code for other OSes: MacOS, Linux
    }
}

fn main() {

    tauri::Builder::default()
        .menu(generate_menu())
        .on_menu_event(on_menu_event)
        .system_tray(generate_tray())
        .on_system_tray_event(on_tray_event)
        // .manage(download_types::DownloadManagerState(Default::default()))
        .invoke_handler(tauri::generate_handler![download, open_explorer])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}



// async fn download_video(app_handle: tauri::AppHandle) -> Result<(), Error> {
//     let yt_dlp_pathbuf = app_handle.path_resolver().resolve_resource("resources/yt-dlp.exe").unwrap();
//     let yt_dlp_path = yt_dlp_pathbuf.to_str().unwrap();

//     println!("{}", yt_dlp_path);

//     let stdout = Command::new(yt_dlp_path)
//     .arg("https://www.youtube.com/watch?v=vGoBEZgENOc")
//     .arg("-f")
//     .arg("mp4")
//     .stdout(Stdio::piped())
//     .spawn()?
//     .stdout
//     .ok_or_else(|| Error::new(ErrorKind::Other,"Could not capture standard output."))?;

//     let reader = BufReader::new(stdout);

//     reader
//         .lines()
//         .for_each(|line| println!("{:?}", line));

//     Ok(())
// }