import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider } from '@mui/material/styles';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { LicenseInfo } from '@mui/x-data-grid-pro';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const muiProLicence = import.meta.env.VITE_MUI_PRO_LICENCE;
LicenseInfo.setLicenseKey(muiProLicence);

const rootElement = document?.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <div
          style={{
            marginLeft: '10px',
            marginRight: '10px',
            marginTop: '10px',
          }}
        >
          <App />
        </div>
      </ThemeProvider>
    </React.StrictMode>
  );
}
