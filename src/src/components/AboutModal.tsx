import { useState, useEffect, Dispatch, SetStateAction } from 'react'
import { getName, getVersion } from '@tauri-apps/api/app';
import { open } from '@tauri-apps/api/shell';
import { Modal, Stack, Group, Text, Button, Divider } from '@mantine/core';
import { ImGithub } from 'react-icons/im'
import { IoPersonSharp } from 'react-icons/io5'

export interface AboutModalProps {
    show: boolean,
    setShow: Dispatch<SetStateAction<boolean>>,
}

export function AboutModal(props : AboutModalProps) {

    const { show, setShow } = props;
    const [name, setName] = useState('')
    const [version, setVersion] = useState('')

    useEffect(() => {
        getName().then((result) => {
            setName(result);
        })
        getVersion().then((result) => {
            setVersion(result);
        })
    }, [])

    return (
        <Modal
            opened={show}
            onClose={() => setShow(false)}
            title={
                <Group>
                    <Text size='xl' weight={700}>
                        About
                    </Text>
                </Group>
            }
            size='sm'
        >
            <Stack align='center' justify='center'>
                <Text> {name} (v{version}) </Text>
                <Button leftIcon={<ImGithub />} variant='filled' color='dark'
                    onClick={() => open("https://github.com/FongYoong/youtube_desktop_downloader")}
                >
                    Code Repository
                </Button>
                <Button leftIcon={<IoPersonSharp />} variant='filled' color='dark'
                    onClick={() => open("https://github.com/FongYoong")}
                >
                    Developer (FongYoong)
                </Button>
                <Stack spacing={4}>
                    <Text>• Built with <a target='_blank' href='https://github.com/tauri-apps/tauri' > Tauri </a></Text>
                    <Text>• YouTube download utility: <a target='_blank' href='https://github.com/yt-dlp/yt-dlp' > yt-dlp </a></Text>
                </Stack>
            </Stack>
        </Modal>
    )
}
