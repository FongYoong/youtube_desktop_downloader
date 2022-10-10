import { invoke } from '@tauri-apps/api'
import { open as openShell } from '@tauri-apps/api/shell';
import { open as openDialog } from '@tauri-apps/api/dialog';
import { showNotification } from '@mantine/notifications';

const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
   
export function formatBytes(x?: string) {
    if (x === undefined || x === '0') {
        return '-'
    }
    let l = 0, n = parseInt(x, 10) || 0;

    while(n >= 1024 && ++l){
        n = n/1024;
    }
    
    return(n.toFixed(n < 10 && l > 0 ? 1 : 0) + ' ' + units[l]);
}

export function openExplorer(path?: string, isPlaylist?: boolean) {
    invoke('open_explorer', { path, isPlaylist });
}

export function openFile(path: string) {
    openShell('file://' + path).catch(() => {
        showNotification({
            title: 'Error',
            message: 'File not found!',
            color: 'red',
            autoClose: 1500
        })
    });
}

export async function openFolderDialog(title: string, defaultPath: string = '') {
    const selected = await openDialog({
        title,
        defaultPath,
        directory: true,
        multiple: false,
    });
    if (typeof selected === 'string') {
        return selected;
    }
    else {
        return undefined
    }
}