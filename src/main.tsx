import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import CssBaseline from "@mui/material/CssBaseline";
import {createTheme, ThemeProvider} from "@mui/material/styles";

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline/>
      <div style={{
        marginLeft: "10px",
        marginRight: "10px",
        marginTop: "10px"
      }}>
        <App/>
      </div>
    </ThemeProvider>
  </React.StrictMode>
)
