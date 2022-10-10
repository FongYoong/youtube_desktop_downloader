export enum DownloadFormats {
    MP4 = 'mp4',
    MP3 = 'mp3',
    M4A = 'm4a',
}

export enum DownloadResolutions {
    RES_144 = '144',
    RES_240 = '240',
    RES_360 = '360',
    RES_480 = '480',
    RES_720 = '720',
    RES_1080 = '1080',
    RES_1440= '1440',
    RES_2160 = '2160',
    RES_7680 = '7680'
}

export interface DownloadParameters {
    id: string
    download_folder: string
    link: string
    format: DownloadFormats
    resolution: DownloadResolutions
}

export interface DownloadItemMetadata {
    title: string
    thumbnail: string
    duration: string
    resolution: string
    file_size: string
    link: string
}

export interface DownloadMetadata {
    id: string
    download_path: string
    file_size: string
    is_playlist: boolean
    playlist_title?: string
    playlist_count?: number
    items: DownloadItemMetadata[]
}

export interface DownloadProgress {
    id: string
    progress_percent: number
    size?: string
    speed?: string
    eta?: string
}

export interface DownloadItem extends DownloadParameters {
    completed: boolean
    failed: boolean
    progress?: DownloadProgress
    metadata?: DownloadMetadata
}

// pub struct DownloadItemMetadata {
//     pub title: String,
//     pub thumbnail: String,
//     pub duration: String,
//     pub resolution: String,
//     pub file_size: String, // bytes
// }
// pub struct DownloadMetadata {
//     pub id: String,
//     pub download_path: String,
//     pub is_playlist: bool,
//     pub playlist_title: Option<String>,
//     pub playlist_count: Option<usize>,
//     pub items: Vec<DownloadItemMetadata>
// }

// export interface DownloadMetadata {
//     id: string
//     type: 'video' | 'playlist'
//     title: string
//     thumbnail: string
//     duration: string
//     resolution: string
//     file_size: string
//     download_path: string
//     is_playlist: boolean
//     playlist_count?: number
// }
