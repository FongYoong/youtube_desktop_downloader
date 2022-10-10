import React from 'react'
import ReactDOM from 'react-dom/client'
import { MantineProvider } from '@mantine/core';
import { NotificationsProvider } from '@mantine/notifications';
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // <React.StrictMode>
    <MantineProvider withNormalizeCSS withGlobalStyles
      theme={{
        fontFamily: 'Source Sans Pro, sans-serif',
        headings: { fontFamily: 'Source Sans Pro, sans-serif' },
        // spacing: { xs: 15, sm: 20, md: 25, lg: 30, xl: 40 },
      }}
    >
      <NotificationsProvider>
        <App />
      </NotificationsProvider>
    </MantineProvider>
  // </React.StrictMode>
)
