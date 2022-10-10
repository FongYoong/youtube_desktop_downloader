import { useState, useMemo, Dispatch, SetStateAction } from 'react'
import { Modal, Stack, Group, TextInput, Text, ScrollArea } from '@mantine/core';
import Markdown from 'marked-react';
import supportedSitesRaw from '../assets/supported_sites.md?raw'
const splittedSupportedSites = supportedSitesRaw.split("\n");

export interface SupportedSitesModalProps {
    show: boolean,
    setShow: Dispatch<SetStateAction<boolean>>,
}

export function SupportedSitesModal(props : SupportedSitesModalProps) {
    
    const { show, setShow } = props;
    const [searchText, setSearchText] = useState('')
    const supportedSites = useMemo(() => 
        splittedSupportedSites.filter((line) => {
            if (line === '') {
                return true;
            }
            else {
                return line.includes(searchText)
            }
        }).join('\n')
    , [searchText]);

    return (
        <Modal
            opened={show}
            onClose={() => setShow(false)}
            title={
                <Group>
                    <Text size='xl' weight={700}>
                        Supported Sites
                    </Text>
                </Group>
            }
            size='sm'
        >
            <Stack align='center' justify='center' >
                <Text style={{ alignSelf: 'flex-start' }} >List from: <a target='_blank' href='https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md' > yt-dlp </a></Text>
                <Group>
                    <Text>Search: </Text>
                    <TextInput
                        labelProps={{
                            
                        }}
                        placeholder="Type here"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </Group>

                <ScrollArea type='auto' style={{ height: '50vh', width: '100%', border: '1px solid black', borderRadius: '0.25em' }} >
                    <Markdown gfm >{supportedSites}</Markdown>
                </ScrollArea>
                {/* <Text> </Text> */}
            </Stack>
        </Modal>
    )
}
