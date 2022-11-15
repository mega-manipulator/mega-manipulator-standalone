import React from "react";
import {Link, Typography} from "@mui/material";
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
    name:'ViteJS',
    description: 'Frontend build tooling',
    link: 'https://vitejs.dev',
    licence: [
      {
        name:'MIT',
        link:'https://github.com/vitejs/vite/blob/main/LICENSE',
      }
    ],
  },
  {
    name:'MUI',
    description: 'MUI offers a comprehensive suite of UI tools to help you ship new features faster. Start with Material UI, our fully-loaded component library, or bring your own design system to our production-ready components.',
    link: 'https://mui.com',
    licence: [
      {
        name:'MIT',
        link: 'https://github.com/mui/material-ui/blob/master/LICENSE',
      },
      {
        name:'Commercial',
        link: 'https://mui.com/legal/mui-x-eula/',
      }
    ],
  },
  {
    name:'', // TODO
    description: '', // TODO
    link: '', // TODO
    licence: [], // TODO
  },
]

export const ThanksPage: React.FC = () => {
  return <>
    <Typography variant={'h4'}>Thanks goes to..</Typography>
    {ossPackages.map((pkg) => <p>
      <Link onClick={()=>open(pkg.link)}><Typography variant={'h6'} style={{cursor: "pointer"}}>{pkg.name}</Typography></Link>
      <Typography>{pkg.description}</Typography>
      {pkg.licence && pkg.licence.map((l)=><Link onClick={()=>open(l.link)}><Typography variant={"button"} style={{cursor: "pointer"}}>{l.name}</Typography></Link>)}
    </p>)}
  </>
};
