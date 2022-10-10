use tauri::Manager; // For emit
use std::fs::{remove_file, read_dir};
use remove_dir_all::{remove_dir_all};
use std::io::{Error, ErrorKind};
use std::path::{Path, MAIN_SEPARATOR};
use sanitize_filename::sanitize;
use std::sync::{Arc};
use async_process::{Command, Stdio, Child};
use async_process::windows::CommandExt;
use futures_lite::{io::BufReader, prelude::*};
use parking_lot::{RwLock};
use lazy_static::lazy_static;
use regex::Regex;

#[derive(Clone, serde::Serialize, serde::Deserialize, Debug)]
pub struct DownloadParameters {
    pub id: String,
    pub download_folder: String,
    pub format: String,
    pub resolution: String,
    pub link: String
}

#[derive(Clone, serde::Serialize)]
pub struct DownloadItemMetadata {
    pub title: String,
    pub thumbnail: String,
    pub duration: String,
    pub resolution: String,
    pub file_size: String, // bytes
    pub link: String
}

#[derive(Clone, serde::Serialize)]
pub struct DownloadMetadata {
    pub id: String,
    pub download_path: String,
    pub file_size: String, // bytes // total for playlist
    pub is_playlist: bool,
    pub playlist_title: Option<String>,
    pub playlist_count: Option<usize>,
    pub items: Vec<DownloadItemMetadata>
}

#[derive(Clone, serde::Serialize)]
pub struct DownloadProgress {
    pub id: String,
    pub progress_percent: f32,
    pub size: Option<String>,
    pub speed: Option<String>,
    pub eta: Option<String>,
}

type IsCancelledStatus = Arc<RwLock<bool>>;
pub struct DownloadProcess {
    pub app_handle: tauri::AppHandle,
    pub is_playlist: bool,
    pub child_process: Child,
    pub progress: DownloadProgress,
    pub is_cancelled: IsCancelledStatus,
}

impl DownloadProcess {

    pub async fn download(app_handle: tauri::AppHandle, download_parameters: &DownloadParameters) -> Result<(), Error> {

        let path_resolver = app_handle.path_resolver();
        let yt_dlp_pathbuf = path_resolver.resolve_resource("resources/yt-dlp.exe").unwrap();
        let yt_dlp_path = yt_dlp_pathbuf.to_str().unwrap();

        let download_path_format = format!("%(title)s_%(epoch>%Y%m%d_%H_%M_%p)s_{}.%(ext)s", download_parameters.id);
        let download_playlist_folder_path_format = format!("%(playlist_title)s_%(epoch>%Y%m%d_%H_%M_%p)s_{}", download_parameters.id);

        // Metadata process
        let mut metadata_command = Command::new(yt_dlp_path);
        metadata_command
        .arg(&download_parameters.link)
        .arg("--no-playlist");

        DownloadProcess::assign_parameters_to_command(&mut metadata_command, &download_parameters);

        metadata_command
        .arg("--print")
        .arg(format!("%(title)s[|]%(thumbnail)s[|]%(duration_string)s[|]%(resolution)s[|]%(filesize_approx)s[|]{}[|]%(playlist_count)s[|]%(playlist_title)s[|]{}[|]%(webpage_url)s", download_path_format, download_playlist_folder_path_format))
        .stdout(Stdio::piped());

        let metadata_child_process = metadata_command.spawn()?;

        let mut is_playlist = false;
        let mut download_path_option: Option<String> = None;

        match String::from_utf8(metadata_child_process.output().await?.stdout) {

            Ok(raw_metadata) => {
                let splitted_metadata: Vec<Vec<&str>> = raw_metadata.trim().split("\n").into_iter().map(|data| {
                    let splitted: Vec<&str> = data.split("[|]").collect();
                    splitted
                }).collect();

                println!("{:?}", splitted_metadata);
                
                if raw_metadata.is_empty() {
                    return Err(Error::new(ErrorKind::Other, "Metadata Error"));
                }

                let all_metadata: Vec<DownloadItemMetadata> = (&splitted_metadata).into_iter().map(|splitted| {
                    DownloadItemMetadata {
                        title: splitted[0].to_string(),
                        thumbnail: splitted[1].to_string(),
                        duration: splitted[2].to_string(),
                        resolution: splitted[3].to_string(),
                        file_size: splitted[4].to_string(),
                        link: splitted[9].to_string(),
                    }
                }).collect();

                if all_metadata.len() > 1 {
                    is_playlist = true;
                }

                let first_metadata = &splitted_metadata[0];
                download_path_option = Some(
                    format!("{}{}{}", download_parameters.download_folder, MAIN_SEPARATOR,
                        sanitize(Path::new(if is_playlist { first_metadata[8] } else { first_metadata[5] }).to_str().unwrap())
                    )
                );

                let total_file_size: u64 = (&all_metadata).iter().map(|d| {
                    match d.file_size.parse::<u64>() {
                        Ok(value) => value,
                        Err(_) => 0
                    }
                }).sum();

                app_handle.emit_all("downloadMetadataEvent",
                DownloadMetadata {
                        id: download_parameters.id.to_string(),
                        download_path: download_path_option.as_ref().unwrap().to_string(),
                        file_size: total_file_size.to_string(),
                        is_playlist,
                        playlist_title: if is_playlist { Some(first_metadata[7].to_string()) } else { None },
                        playlist_count: if is_playlist { Some(first_metadata[6].parse::<usize>().unwrap()) } else { None },
                        items: all_metadata
                }).unwrap();
            }
            Err(e) => {
                println!("Failed to obtain metadata: {:?}", e);
            }
        }

        let download_path = download_path_option.as_ref().unwrap();

        // Download process
        let mut download_command = Command::new(yt_dlp_path);
        download_command
        .arg(&download_parameters.link)
        .arg("--no-playlist");

        DownloadProcess::assign_parameters_to_command(&mut download_command, &download_parameters);

        download_command
        .arg("--no-part")
        .arg("-o")
        .arg(if is_playlist { format!("{}/%(title)s.%(ext)s", download_path.to_string()) } else { download_path.to_string() })
        .arg("--newline")
        .stdout(Stdio::piped());

        let download_child_process = download_command.spawn()?;

        let mut download_process = DownloadProcess::new(app_handle.clone(), download_parameters.id.to_string(), is_playlist, download_child_process);
        let is_cancelled_arc = download_process.is_cancelled.clone();
        let listen_cancel_id = app_handle.listen_global(format!("cancel-{}", download_parameters.id), move |event| {
            println!("Cancel event received.");
            let mut is_cancelled = is_cancelled_arc.write();
            *is_cancelled = true;
        });
        download_process.run().await;
        
        // Cleanup and remove download parts if download process is cancelled
        if *(download_process.is_cancelled.read()) {
            let _ = download_process.child_process.output().await?;
            let mut delete_result: Option<std::io::Result<()>> = None;
            if is_playlist {
                delete_result = Some(remove_dir_all(download_path));
            }
            else {
                let download_file_name = Path::new(download_path).file_stem().unwrap().to_str().unwrap();
                let files = read_dir(download_parameters.download_folder.as_str()).unwrap();
                for file in files {
                    let file_path = file.unwrap().path();
                    let file_name = file_path.file_stem().unwrap().to_str().unwrap();
                    if file_name.contains(download_file_name) {
                        delete_result = Some(remove_file(file_path));
                        break;
                    }
                }
            }
            if let Some(result) = delete_result {
                match result {
                    Ok(_) => { println!("Successfully removed parts") }
                    Err(e) => { println!("Failed to remove parts: {}", e); }
                }
            }
        }
        app_handle.unlisten(listen_cancel_id);
        Ok(())
    }

    pub fn assign_parameters_to_command(command: &mut Command, download_parameters: &DownloadParameters) {
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        // const DETACHED_PROCESS: u32 = 0x00000008;
        command.creation_flags(CREATE_NO_WINDOW);
        println!("{}", download_parameters.format);
        match download_parameters.format.as_str() {
            "mp4" => {
                command
                .arg("-f")
                .arg(format!("bv[height<={}]+ba", download_parameters.resolution))
                .arg("--merge-output-format")
                .arg(download_parameters.format.as_str());
            }
            // Audio outputs
            "m4a" => {
                command
                .arg("-f")
                .arg(download_parameters.format.as_str());
            }
            "mp3" => {
                command
                .arg("-x")
                .arg("--audio-format")
                .arg("mp3");
            }
            format => {
                panic!("Format {} is not handled.", format)
            }
        };
    }

    pub fn new(app_handle: tauri::AppHandle, id: String, is_playlist: bool, child_process: Child) -> Self {
        Self { 
            app_handle, is_playlist, child_process,
            progress: DownloadProgress { 
                id, progress_percent: 0.0, size: None, speed: None, eta: None 
            },
            is_cancelled: IsCancelledStatus::new(Default::default())
        }
    }

    pub async fn run(&mut self) {

        lazy_static! {
            static ref TITLE_REGEX: Regex = Regex::new(r"\[download\]\s+(\d+\.\d+)%.*of\s+(.*)\s+at\s+(.*)\s+ETA\s+(.*)").unwrap();
            static ref PROGRESS_REGEX1: Regex = Regex::new(r"\[download\].*of.*at.*ETA.*").unwrap();
            static ref PROGRESS_REGEX2: Regex = Regex::new(r"\[download\]\s+(\d+\.\d+)%.*of\s+(.*)\s+at\s+(.*)\s+ETA\s+(.*)").unwrap();
        }

        while self.is_alive().await {
            let is_cancelled = self.is_cancelled.read();
            if *is_cancelled {
                match self.child_process.kill() {
                    Ok(_) => {
                        println!("Cancelled and killed child process");
                    }
                    Err(e) => {
                        println!("Failed to kill child process: {}", e);
                    }
                }
            }
            match &mut self.child_process.stdout {
                Some(stdout) => {
                    let mut lines = BufReader::new(stdout).lines();
                    if let Some(line) = lines.next().await {
                        // println!("Line: {:?}", line);
                        match line {
                            Ok(line_string) => {
                                let line_str = line_string.as_str();
                                if PROGRESS_REGEX1.is_match(line_str) {
                                    let captures = PROGRESS_REGEX2.captures(line_str).unwrap();
                                    self.progress.progress_percent = captures.get(1).unwrap().as_str().parse::<f32>().unwrap();
                                    self.progress.size = Some(captures.get(2).unwrap().as_str().to_string());
                                    self.progress.speed = Some(captures.get(3).unwrap().as_str().clone().to_string());
                                    self.progress.eta = Some(captures.get(4).unwrap().as_str().clone().to_string());
                                }
                            }
                            Err(e) => {
                                println!("stdout error: {}", e);
                            }
                        }
                        self.app_handle.emit_all("downloadProgressEvent", self.progress.clone() ).unwrap();
                    }
                }
                None => {
    
                }
            };
        }

    }

    pub async fn is_alive(&mut self) -> bool {
        match self.child_process.try_status() {
            Ok(Some(status)) => {
                false
            },
            Ok(None) => {
                true
            }
            Err(e) => {
                println!("Error attempting to wait for download child process: {e}");
                false
            },
        }
    }

}

// #[derive(Default)]
// pub struct DownloadManager {
//   pub processes: Vec<DownloadProcess>
// }
// pub struct DownloadManagerState(pub RwLock<DownloadManager>);