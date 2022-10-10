import { downloadDir } from '@tauri-apps/api/path';
import { exists, createDir, writeTextFile, readTextFile, BaseDirectory } from '@tauri-apps/api/fs';
import { Config } from '../types/config';

export const configFilename = 'config';

export async function getConfig () {
    // const appDirPath = await appDir();
    // const path = await normalize(appDirPath);
    // console.log(path)

    let config: Config;
    const fileExists = await exists(configFilename, { dir: BaseDirectory.App }) as unknown as boolean;
    if (fileExists) {
        config = JSON.parse(await readTextFile(configFilename, { dir: BaseDirectory.App }));
    }
    else {
        const dirExists = await exists('', { dir: BaseDirectory.App }) as unknown as boolean;
        if (!dirExists) {
            await createDir('', { dir: BaseDirectory.App });
        }
        config = {
            downloads: [],
            downloadFolder: await downloadDir()
        };
        await writeTextFile(configFilename, JSON.stringify(config), { dir: BaseDirectory.App });
    }
    return config;
}

export async function saveConfig (config: Config) {
    await writeTextFile(configFilename, JSON.stringify(config), { dir: BaseDirectory.App });
    console.log('saved config');
}
