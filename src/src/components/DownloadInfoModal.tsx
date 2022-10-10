import { useState, useEffect, useMemo, Dispatch, SetStateAction } from 'react'
import { Modal, Stack, Group, Text, Button, Divider } from '@mantine/core';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { css } from '@emotion/react'
import { MdOutlineErrorOutline, MdFolderOpen, MdAspectRatio, MdAccessTime } from 'react-icons/md'
import { FiClipboard, FiFile } from 'react-icons/fi'
import { DownloadItem, DownloadMetadata, DownloadItemMetadata } from '../types/download'
import { formatBytes, openExplorer } from '../lib/utils';
import { writeText } from '@tauri-apps/api/clipboard';
import { open } from '@tauri-apps/api/shell';
import { showNotification } from '@mantine/notifications';
import { Ring, DotPulse } from '@uiball/loaders'

export interface DownloadInfoModalProps {
    show: boolean,
    setShow: Dispatch<SetStateAction<boolean>>,
    downloadInfo?: DownloadItem
}

export function DownloadInfoModal(props : DownloadInfoModalProps) {

    const { show, setShow, downloadInfo } = props;

    const modalContent = useMemo(() => {
        return downloadInfo ? <ModalContent {...downloadInfo} /> : <></>
    }, [downloadInfo])

    return (
        <Modal
            opened={show}
            onClose={() => setShow(false)}
            title={
                <Group>
                    <Text size='xl' weight={700}>
                        Download Info
                    </Text>
                    {!downloadInfo?.failed && downloadInfo?.metadata && !downloadInfo?.completed &&
                        <DotPulse 
                            size={20}
                            speed={1.3} 
                            color="black" 
                        />
                    }

                </Group>

            }
            size='lg'
            // centered
        >
            {modalContent}
        </Modal>
    )

}

function PathDetail({metadata}: {metadata: DownloadMetadata}) {

    return (
        <>
            <Group noWrap align='flex-start' >
                <Text style={{ flex: 1, whiteSpace: 'nowrap' }} size='md' >
                    Path: 
                </Text>
                <div 
                    css={css`
                        position: relative;
                        cursor: pointer;
                        background-color: #fffceb;
                        word-break: break-all;
                        border-radius: 0.5em;
                        padding: 8px;
                        padding-bottom: 16px;
                        padding-right: 16px;
                        &:hover {
                            box-shadow: 0px 0px 17px 3px rgba(0,0,0,0.1);
                            background-color: #faf4cf;
                        }
                        &:focus {
                            border-color: #a8a8a8;
                        }
                    `}
                    onClick={() => {
                        if (metadata.download_path) {
                            writeText(metadata.download_path).then(() => {
                                showNotification({
                                    title: 'Success',
                                    message: 'Copied download path to clipboard',
                                    color: 'green',
                                    autoClose: 1500
                                })
                            });
                        }

                    }}
                >
                    <Text size='xs' style={{
                        overflowY: 'auto',
                        maxHeight: '20vh'
                    }}>
                        {metadata.download_path}
                    </Text>
                    <FiClipboard style={{
                        position: 'absolute',
                        right: 0,
                        bottom: 0
                    }} />
                </div>
            </Group>
            <Button color='teal' variant='filled' leftIcon={<MdFolderOpen size='2em' />}
                onClick={() => {
                    openExplorer(metadata.download_path, metadata.is_playlist);
                }}
            >
                Locate
            </Button>
        </>
    )
}

function PlaylistItem({index, metadata} : {index: number, metadata: DownloadItemMetadata}) {

    return (
        <Stack
            css={css`
                cursor: pointer;
                position: relative;
                width: 100%;
                padding: 8px;
                background-color: white;
                border-radius: 0.5em;
                border-color: black;
                border-width: 1px;
                border-style: solid;
                &:hover {
                    background-color: #f2f2f2;
                }
            `}
            onClick={() => {
                open(metadata.link);
            }}
        >
            <Group>
                <Text size='md' >
                    {index}
                </Text>
                <LazyLoadImage
                    effect="blur"
                    alt={metadata.title}
                    // height={'30%'}
                    // width={'53.33%'}
                    src={metadata.thumbnail}
                    style={{
                        objectFit: 'cover',
                        borderRadius: '0.25em',
                        alignSelf: 'center',
                        height: '100%',
                        width: '100%'
                    }}
                    wrapperProps={{
                        style: {
                            height: '20vh',
                            width: '35.55vh',
                            display: 'flex',
                            color: 'transparent',
                            alignContent: 'center',
                            justifyContent: 'center'
                        }
                    }}
                />
            </Group>

            <Stack>
                <Text size='md' weight={700} >
                    {metadata.title}
                </Text>
                <Group spacing={8} >
                    <Group spacing={2} >
                        <MdAccessTime />
                        <Text size='sm' >
                            {metadata.duration}
                        </Text>
                    </Group>
                    <Divider orientation='vertical' />
                    <Group spacing={2} >
                        <FiFile />
                        <Text size='sm' >
                            {formatBytes(metadata.file_size)}
                        </Text>
                    </Group>
                    <Divider orientation='vertical' />
                    <Group spacing={2} >
                        <MdAspectRatio />
                        <Text size='sm' >
                            {metadata.resolution}
                        </Text>
                    </Group>
                </Group>

            </Stack>
        </Stack>
    )
}

function ModalContent(props: DownloadItem) {

    const {link, format, resolution, progress, metadata, failed, completed} = props;

    // const status = useMemo(() => {

    //     if (completed) {
    //         return ""
    //     }
    //     else {
    //         if (metadata) {
    //             return "Downloading"
    //         }
    //         else {
    //             return "Fetching info"
    //         }
    //     }
    // }, [completed, metadata])

    const title = useMemo(() => {
        if (metadata) {
            return metadata.is_playlist ? metadata.playlist_title : metadata.items[0].title;
        }
        return ''
    }, [metadata])

    const videoMetadata = useMemo(() => {
        if (metadata) {
            return metadata.items[0]
        }
    }, [metadata])

    return (
        <Group noWrap align='flex-start' position='center' >
            {failed &&
                <Group spacing={4} >
                    <MdOutlineErrorOutline color='red' />
                    <Text>
                        An error occurred.
                    </Text>
                </Group>
            }
            {!failed && !metadata && 
                <Group>
                    <Ring 
                        size={40}
                        lineWeight={5}
                        speed={2} 
                        color="black" 
                    />
                    <Text size='xl'>
                        Fetching metadata...
                    </Text>
                </Group>
            }
            {metadata?.is_playlist &&
                <>
                    <Stack style={{ flex: 1 }} spacing={4} >
                        <Text size='md' >
                            Playlist Title: <a target="_blank" href={link} >{title}</a>
                        </Text>
                        <Text size='md' >
                            Format: {format}
                        </Text>
                        <Text size='md' >
                            Resolution: {resolution}p
                        </Text>
                        <Text size='md' >
                            Total size: {formatBytes(metadata?.file_size)}
                        </Text>
                        {metadata &&
                            <PathDetail metadata={metadata} />
                        }
                    </Stack>
                    <Divider orientation='vertical' />

                    <Stack style={{ 
                            flex: 2,
                            overflowY: 'auto',
                            maxHeight: '50vh',
                            padding: 8
                        }}
                        spacing={4} align='flex-start' justify='flex-start'
                    >
                        {metadata.items.map((d, index) => <PlaylistItem key={index} index={index + 1} metadata={d} />)}
                    </Stack>
                </>
            }
            {!metadata?.is_playlist && videoMetadata &&
                <>
                    <LazyLoadImage
                        effect="blur"
                        alt={videoMetadata.title}
                        src={videoMetadata.thumbnail}
                        style={{
                            objectFit: 'cover',
                            borderRadius: '0.25em',
                            alignSelf: 'center',
                            height: '100%',
                            width: '100%'
                        }}
                        wrapperProps={{
                            style: {
                                height: '20vh',
                                width: '35.55vh',
                                display: 'flex',
                                color: 'transparent',
                                alignContent: 'center',
                                justifyContent: 'center'
                            }
                        }}
                    />
                    <Stack style={{ flex: 1 }} spacing={4} >
                        <Text size='md' >
                            Title: <a target="_blank" href={link} >{title}</a>
                        </Text>
                        <Text size='md' >
                            Format: {format}
                        </Text>
                        <Text size='md' >
                            Resolution: {videoMetadata.resolution}
                        </Text>
                        <Text size='md' >
                            Total size: {formatBytes(videoMetadata.file_size)}
                        </Text>
                        {metadata &&
                            <PathDetail metadata={metadata} />
                        }
                    </Stack>
                </>
            }
        </Group>
    )
}