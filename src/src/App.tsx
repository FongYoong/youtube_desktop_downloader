import { useState, useEffect, useRef, useMemo, KeyboardEvent } from 'react'
import { invoke } from '@tauri-apps/api'
import { emit, Event, listen, UnlistenFn } from '@tauri-apps/api/event'
import { AppShell, Group, Stack, Button, ActionIcon, TextInput, Text, Divider, Select } from '@mantine/core';
import { DownloadFormats, DownloadItem, DownloadMetadata, DownloadParameters, DownloadProgress, DownloadResolutions } from './types/download';
import { getConfig, saveConfig } from './lib/config'
import { openFolderDialog } from './lib/utils'
import { v4 as uuidv4 } from 'uuid';
import { AboutModal } from './components/AboutModal';
import { SupportedSitesModal } from './components/SupportedSitesModal';
import { DownloadCard } from './components/DownloadCard';
import { DownloadInfoModal } from './components/DownloadInfoModal';
import { MdClear, MdFolderOpen } from 'react-icons/md'
import { FiDownload } from 'react-icons/fi'

// import reactLogo from './assets/react.svg'

function App() {

  const tauriUnlistenersRef = useRef<[UnlistenFn]>()

  const [loadingConfig, setLoadingConfig] = useState(true)
  const [downloadFolder, setDownloadFolder] = useState('')
  const [downloads, setDownloads] = useState<DownloadItem[]>([])
  const downloadsRef = useRef<DownloadItem[]>()
  downloadsRef.current = downloads;

  const locateDownloadById = (id: string) => {
    if (downloadsRef.current) {
      return downloadsRef.current.find((d) => d.id === id);
    }
    return undefined
  }

  const [downloadLink, setDownloadLink] = useState('')
  const [downloadFormat, setDownloadFormat] = useState(DownloadFormats.MP4)
  const [downloadHighestResolution, setDownloadHighestResolution] = useState(DownloadResolutions.RES_1080)

  const linkError = useMemo(() => {
    try {
      new URL(downloadLink);
      return false;
    }
    catch {
      return true;
    }
  }, [downloadLink])

  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showSupportedSitesModal, setShowSupportedSitesModal] = useState(false);

  const [showDownloadInfoModal, setShowDownloadInfoModal] = useState(false);
  const [selectedDownloadId, setSelectedDownloadId] = useState<string | undefined>(undefined);
  const selectedDownloadInfo = useMemo(() => {
      return selectedDownloadId ? locateDownloadById(selectedDownloadId) : undefined;
  }, [selectedDownloadId, downloads])


  useEffect(() => {

    document.addEventListener('contextmenu', e => {
      e.preventDefault();
      return false;
      }, { capture: true })

    getConfig().then((config) => {
      console.log(config)
      setTimeout(() => {
        setLoadingConfig(false);
      }, 0)
      setDownloadFolder(config.downloadFolder);
      setDownloads(config.downloads);
    });

    listen('menu_about', (event: Event<DownloadMetadata>) => {
      setShowAboutModal(true);
    }).then((unlisten) => {
      tauriUnlistenersRef.current?.push(unlisten);
    })

    listen('menu_supported_sites', (event: Event<DownloadMetadata>) => {
      setShowSupportedSitesModal(true);
    }).then((unlisten) => {
      tauriUnlistenersRef.current?.push(unlisten);
    })

    listen('downloadMetadataEvent', (event: Event<DownloadMetadata>) => {
      if (downloadsRef.current) {
        const downloadProcess = locateDownloadById(event.payload.id);
        if (downloadProcess) {
          console.log(event.payload)
          setDownloads((prev) => {
            return prev.map((d) => d.id === downloadProcess.id ?
              {
                ...d,
                metadata: event.payload
              }
              :
              d
            )
          })
        }
      }

    }).then((unlisten) => {
      tauriUnlistenersRef.current?.push(unlisten);
    })


    listen('downloadProgressEvent', (event: Event<DownloadProgress>) => {
      if (downloadsRef.current) {
        const downloadProcess = locateDownloadById(event.payload.id);
        if (downloadProcess) {
          setDownloads((prev) => {
            return prev.map((d) => d.id === downloadProcess.id ?
              {
                ...d,
                progress: event.payload
              }
              :
              d
            )
          })
        }
      }
    }).then((unlisten) => {
      tauriUnlistenersRef.current?.push(unlisten);
    })

    return () => {
      tauriUnlistenersRef.current?.forEach((unlistener) => unlistener())
    }

  }, [])

  useEffect(() => {
    if (!loadingConfig) {
      saveConfig({
        downloadFolder,
        downloads
      });
    }
  }, [downloadFolder, downloads])

  const startDownload = () => {
    if (!linkError) {
      const downloadId = uuidv4();
      const downloadParameters: DownloadParameters = {
        id: downloadId,
        download_folder: downloadFolder,
        link: downloadLink,
        format: downloadFormat,
        resolution: downloadHighestResolution,
      }
      setDownloads([...downloads, {
            ...downloadParameters,
            completed: false,
            failed: false
        }]
      )
      invoke('download', { downloadParameters })
      .then((response: any) => {
        console.log('Download complete: ', response);
        const downloadProcess = locateDownloadById(downloadId);
        if (downloadProcess) {
          setDownloads((prev) => {
            return prev.map((d) => d.id === downloadProcess.id ?
                {
                  ...d,
                  completed: true
                }
              :
              d
            )
          })
        }
      }).catch((e) => {
        console.log(e);
        const downloadProcess = locateDownloadById(downloadId);
        if (downloadProcess) {
          setDownloads((prev) => {
            return prev.map((d) => d.id === downloadProcess.id ?
                {
                  ...d,
                  failed: true
                }
              :
              d
            )
          })
        }
      })
    }
  }

  return (
    <AppShell
      padding="md"
      styles={(theme) => ({
        main: { 
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
        },
      })}
    >
      <AboutModal show={showAboutModal} setShow={setShowAboutModal} />
      <SupportedSitesModal show={showSupportedSitesModal} setShow={setShowSupportedSitesModal} />
      <DownloadInfoModal show={showDownloadInfoModal} setShow={setShowDownloadInfoModal} downloadInfo={selectedDownloadInfo} />
      <Group noWrap align='flex-start' style={{
        height: '80vh',
        width: '95vw'
      }} >
        <Stack style={{ flex: 1 }} >
          <TextInput
              style={{
                flex: 1
              }}
              label="Link"
              placeholder="Paste YouTube link here"
              value={downloadLink}
              onChange={(e) => setDownloadLink(e.target.value)}
              error={linkError && downloadLink !== '' ? "Invalid link" : ""}
              onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                if (e.key =="Enter" ) {
                  startDownload();
                }
              }}
          />
          <Select
            label="Format"
            placeholder="Pick one"
            value={downloadFormat}
            data={Object.values(DownloadFormats).map((v) => {
              return { value: v, label: v }
            } )}
            onChange={(v) => setDownloadFormat(v as DownloadFormats)}
          />
          {downloadFormat == DownloadFormats.MP4 &&
            <Select
              label="Resolution"
              placeholder="Pick one"
              value={downloadHighestResolution}
              data={Object.values(DownloadResolutions).map((v) => {
                return { value: v, label: v + 'p' }
              } )}
              onChange={(v) => setDownloadHighestResolution(v as DownloadResolutions)}
            />
          }

          <Stack spacing={0} >
            <Text size='sm' >Download Folder</Text>
            <Group spacing={4} noWrap
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cfcccc',
                borderRadius: '0.25em',
                padding: 4
              }}
            >
              <Text size='xs' style={{ wordBreak: 'break-all' }} >{downloadFolder}</Text>
              <ActionIcon color='gray' variant='filled' 
                onClick={() => {
                  openFolderDialog("Choose Download Folder", downloadFolder).then((f) => {
                    if (f) {
                      setDownloadFolder(f);
                    }
                  })
                }}
              >
                <MdFolderOpen />
              </ActionIcon>
            </Group>
          </Stack>

          <Button leftIcon={<FiDownload size='1em' />} size='sm' variant="filled" color='blue'
            onClick={startDownload}
          >
            Download
          </Button>
        </Stack>

        <Divider orientation='vertical' />
        <Stack style={{ flex: 4, height: '100%' }}>
          <Group>
            <Text weight={700} size="lg">
              Downloads ({downloads.filter((d) => d.completed).length} completed, {downloads.filter((d) => !d.completed).length} downloading)
            </Text>
            <Button leftIcon={<MdClear />} variant='light' color='red' onClick={() => setDownloads([])} >
                Clear list
            </Button>
          </Group>

          <Divider />
          <Stack spacing={2} style={{
            overflowY: 'auto',
            flex: 3,
            // border: '1px solid #a8a8a8'
            backgroundColor: '#fafafa'
          }}>
            {downloads.slice(0).reverse().map((download, index) => {
              const onRemove = () => {
                setDownloads(downloads.filter((d) => d.id !== download.id))
              }
              return (
                <DownloadCard key={index} {...download}
                  onInfo={() => {
                    setSelectedDownloadId(download.id);
                    setShowDownloadInfoModal(true);
                  }}
                  onCancel={() => {
                    emit(`cancel-${download.id}`)
                    onRemove();
                  }}
                  onRemove={onRemove}
                />
              )
            })}
          </Stack>
        </Stack>
      </Group>
    </AppShell>

  )
}

export default App