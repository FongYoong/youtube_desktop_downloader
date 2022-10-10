import { useState, useEffect, useMemo, useRef, MouseEvent } from 'react'
import { Badge, Group, Stack, Button, ActionIcon, Text, Divider, Progress, Menu, Popover } from '@mantine/core';
import { css } from '@emotion/react'
import { MdLink, MdOutlineErrorOutline, MdCancel, MdOutlineDownloadDone, MdFolderOpen, MdAudiotrack, MdVideocam, MdArrowDropDownCircle, MdDelete, MdInfo } from 'react-icons/md'
import { IoOpenOutline } from 'react-icons/io5'
import { DotPulse } from '@uiball/loaders'
import { DownloadItem } from '../types/download'
import { formatBytes, openExplorer, openFile } from '../lib/utils';

// const DownloadMinorDetailText = (props: TextProps) => {
//     return (
//         <Text size='xs' {...props} />
//     )
// }

export interface DownloadCardProps extends DownloadItem {
    onInfo: () => void
    onCancel: () => void
    onRemove: () => void
}

export function DownloadCard(props : DownloadCardProps) {

    const [showCancelPopover, setShowCancelPopover] = useState(false);

    const {format, resolution, progress, metadata, failed, completed, onInfo, onCancel, onRemove} = props;

    const isAudioFormat = useMemo(() => {
        return ['mp3', 'm4a'].includes(format);
    }, [format]);

    const downloadType = useMemo(() => {
        if (metadata) {
            if (metadata.is_playlist) {
                return 'Playlist'
            }
            else {
                return isAudioFormat ? 'Audio' : 'Video'
            }
        };
    }, [metadata, isAudioFormat])

    const progress_percent = useMemo(() => {
        if (progress) {
            return progress.progress_percent;
        }
        else {
            return 0.0;
        }
    }, [progress]);

    const status = useMemo(() => {
        if (failed) {
            return "An error occurred."
        }
        else if (completed) {
            return ""
        }
        else {
            if (metadata) {
                return "Downloading"
            }
            else {
                return "Fetching info"
            }
        }
    }, [failed, completed, metadata])

    const title = useMemo(() => {
        if (metadata) {
            return metadata.is_playlist ? metadata.playlist_title : metadata.items[0].title;
        }
        return ''
    }, [metadata])

    const fileSize = useMemo(() => {
        if (!completed && progress) {
            return progress.size;
        }
        else if (completed && metadata) {
            return formatBytes(metadata.file_size);
        }
    }, [metadata, progress, completed])

    const onLocate = () => {
        openExplorer(metadata?.download_path, metadata?.is_playlist);
    }

    return (
        <Group align='center' position='apart'
            tabIndex={0}
            css={css`
                cursor: pointer;
                padding: 8px;
                margin: 4px;
                background-color: white;
                border-radius: 4px;
                border-width: 1px;
                border-style: solid;
                border-color: #dedede;
                &:hover {
                    box-shadow: 0px 0px 17px 3px rgba(0,0,0,0.1);
                }
                &:focus {
                    border-color: #a8a8a8;
                }
            `}
            onClick={onInfo}
        >
            <Stack spacing={2} style={{ flex: 1 }} >
                <Group spacing={8} >
                    {downloadType &&
                        <Badge variant="filled" color={downloadType==='Playlist'?'cyan':'pink'} >
                            {downloadType}
                        </Badge>
                    }
                    {!failed && <> {isAudioFormat ? <MdAudiotrack /> : <MdVideocam />} </> }
                    <Text size='md' lineClamp={2}>
                        {title}
                    </Text>
                </Group>
                {!failed && !completed && 
                    <Group>
                        <Progress style={{ flex: 1 }} value={progress_percent} />
                        <Text size='md'>
                            {progress_percent.toFixed(2)} %
                        </Text>
                    </Group>
                }
                {failed &&
                    <Group spacing={4} >
                        <MdLink />
                        <Text size='sm'>
                            {props.link}
                        </Text>
                    </Group>
                }
                <Group spacing={6} >
                    {failed && <MdOutlineErrorOutline color='red' />}
                    {completed && <MdOutlineDownloadDone /> }
                    {!failed && !completed && 
                        <DotPulse 
                            size={20}
                            speed={1.3} 
                            color="black" 
                        />
                    }
                    <Text size='sm'>
                        {status}
                    </Text>
                    {!completed && metadata && progress &&
                        <>
                            <Divider orientation='vertical' />
                            <Text size='xs'>
                                {progress.speed == null ? '-' : progress.speed}
                            </Text>
                            <Divider orientation='vertical' />
                            <Text size='xs'>
                                ETA: {progress.eta == null ? '-' : progress.eta}
                            </Text>
                            {/* <Divider orientation='vertical' />
                            <Text size='xs'>
                                File size: {formatBytes(metadata.file_size)}
                            </Text> */}
                        </>
                    }
                    {progress && completed &&
                        <>
                            <Divider orientation='vertical' />
                            {/* <Text size='sm'>
                                {metadata?.download_path}
                            </Text> */}
                            <Text size='xs'>
                                Format: {format}
                            </Text>
                            {!metadata?.is_playlist && 
                                <>
                                    <Divider orientation='vertical' />
                                    <Text size='xs'>
                                        Duration: {metadata?.items[0].duration}
                                    </Text>
                                </>
                            }

                            <Divider orientation='vertical' />
                            <Text size='xs'>
                                Resolution: {metadata?.is_playlist ? `${resolution}p` : metadata?.items[0].resolution}
                            </Text>
                        </>
                    }
                    {metadata &&
                        <>
                            <Divider orientation='vertical' />
                            <Text size='xs'>
                                {metadata.is_playlist && completed ? "Total size" : "File size"}: {fileSize}
                            </Text>
                        </>
                    }

                </Group>

            </Stack>
            <Group noWrap spacing={1} onClick={(e: MouseEvent<HTMLDivElement>) => { e.stopPropagation() }} >
                {failed &&
                    <Button leftIcon={<MdDelete />} variant="filled" color='red'
                        onClick={onRemove}
                    >
                        Remove
                    </Button>
                }
                {!failed && !completed && metadata &&
                    <Popover opened={showCancelPopover} onChange={setShowCancelPopover} position="left" withArrow shadow="md">
                        <Popover.Target>
                            <Button leftIcon={<MdCancel />} variant="filled" color='red' onClick={() => setShowCancelPopover(true)} >
                                Cancel
                            </Button>
                        </Popover.Target>
                        <Popover.Dropdown>
                          <Group>
                            <Button color='green' onClick={() => { 
                                onCancel();
                                setShowCancelPopover(false); 
                            }} > Yes </Button>
                            <Button color='red' onClick={() => setShowCancelPopover(false)} > No </Button>
                          </Group>
                        </Popover.Dropdown>
                    </Popover>
                }
                {completed &&
                <>
                    <Button leftIcon={<MdFolderOpen size='1.5em' />} variant="filled" color='teal'
                        onClick={onLocate}
                    >
                        Locate
                    </Button>
                    <Menu shadow="md">
                        <Menu.Target>
                            <ActionIcon variant='light' >
                                <MdArrowDropDownCircle />
                            </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                            {metadata && !metadata.is_playlist && 
                                <Menu.Item icon={<IoOpenOutline />} onClick={() => openFile(metadata.download_path)} >
                                    View
                                </Menu.Item>
                            }
                            <Menu.Item icon={<MdFolderOpen />} onClick={onLocate} >
                                Open In Explorer
                            </Menu.Item>
                            <Menu.Item icon={<MdInfo />} onClick={onInfo} >
                                Info
                            </Menu.Item>
                            <Menu.Item color="red" icon={<MdDelete />} onClick={onRemove} >
                                Remove
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </>
                }

            </Group>
        </Group>
    )
}


