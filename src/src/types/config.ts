import { DownloadItem } from './download'

export interface Config {
    downloads: DownloadItem[]
    downloadFolder: string
}