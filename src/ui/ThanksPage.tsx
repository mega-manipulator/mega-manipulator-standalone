import React from "react";
import {Chip, Link, Typography} from "@mui/material";
import {open} from '@tauri-apps/api/shell';

interface LicenceType {
  name: string,
  link: string,
}

interface ThanksType {
  name: string,
  link: string,
  description: string,
  licence: LicenceType[],
}

const ossPackages: ThanksType[] = [
  {
    name: 'Tauri',
    description: 'Build an optimized, secure, and frontend-independent application for multi-platform deployment.',
    link: 'https://tauri.app',
    licence: [
      {
        name: 'Apache-2.0',
        link: 'https://github.com/tauri-apps/tauri/blob/dev/LICENSE_APACHE-2.0',
      },
      {
        name: 'MIT',
        link: 'https://github.com/tauri-apps/tauri/blob/dev/LICENSE_MIT'
      },
    ],
  },
  {
    name: 'ViteJS',
    description: 'Frontend build tooling',
    link: 'https://vitejs.dev',
    licence: [
      {
        name: 'MIT',
        link: 'https://github.com/vitejs/vite/blob/main/LICENSE',
      }
    ],
  },
  {
    name: 'MUI',
    description: 'MUI offers a comprehensive suite of UI tools to help you ship new features faster. Start with Material UI, our fully-loaded component library, or bring your own design system to our production-ready components.',
    link: 'https://mui.com',
    licence: [
      {
        name: 'MIT',
        link: 'https://github.com/mui/material-ui/blob/master/LICENSE',
      },
      {
        name: 'Commercial',
        link: 'https://mui.com/legal/mui-x-eula/',
      }
    ],
  },
  {
    name: 'JetBrains',
    description: 'JetBrains develops smart IDEs, like IDEA and CLion, to superpower developers.',
    link: 'https://jetbrains.com/',
    licence: [
      {
        name: 'Community',
        link: 'https://www.jetbrains.com/idea/download/',
      },
      {
        name: 'Commercial',
        link: 'https://www.jetbrains.com/idea/buy/#personal',
      }
    ],
  },
  {
    name: 'react-router',
    description: 'React Router enables "client side routing".',
    link: 'https://reactrouter.com/en/main',
    licence: [
      {
        name: 'MIT',
        link: 'https://github.com/remix-run/react-router/blob/main/LICENSE.md'
      }
    ],
  },
  {
    name: 'Axios',
    description: 'Promise based HTTP client for the browser and node.js',
    link: 'https://axios-http.com/',
    licence: [{
      name: 'MIT',
      link: 'https://github.com/axios/axios/blob/v1.x/LICENSE'
    }],
  },
  {
    name:'@emotion/{react,styled}',
    description: 'Simple styling in React.',
    link: 'https://emotion.sh',
    licence: [{
      name: 'MIT',
      link: 'https://github.com/emotion-js/emotion/blob/main/LICENSE',
    }], // TODO
  },
  /*
  {
    name:'', // TODO
    description: '', // TODO
    link: '', // TODO
    licence: [], // TODO
  },
   */
]

export const ThanksPage: React.FC = () => {
  return <>
    <Typography variant={'h4'}>Thanks goes to..</Typography>
    {ossPackages.map((pkg) => <p>
      <Link onClick={() => open(pkg.link)}><Typography
        variant={'h6'}
        style={{cursor: "pointer"}}
      >{pkg.name}</Typography></Link>
      <Typography>{pkg.description}</Typography>
      {pkg.licence && pkg.licence.map((l) => <Link onClick={() => open(l.link)}>
        <Chip
          style={{cursor: "pointer"}}
          variant={"filled"}
          label={l.name}/>
      </Link>)}
    </p>)}
  </>
};
