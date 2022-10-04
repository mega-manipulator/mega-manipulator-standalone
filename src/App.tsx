import {useState} from 'react'
import logo from './logo.svg'
import './App.css'
import {Command} from '@tauri-apps/api/shell'
import { Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [count, setCount] = useState(0)
  const [output, setOutput] = useState('')
  const [isUpdateActive, setIsUpdateActive] = useState(true)

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo"/>
        <p>Hello Vite + React!</p>
        <p>
          <Button variant={"success"}  onClick={() => setCount(count + 1)}>
            Count is: {count}
          </Button>
          <br/>
          <Button variant={"success"} disabled={!isUpdateActive} onClick={async () => {
            try {
              setIsUpdateActive(false)
              let process = await (new Command('run-brew', ['update'])).execute()
              setOutput(process.stdout)
            } catch (e) {
              setOutput(JSON.stringify(e))
            }
            setIsUpdateActive(true)
          }}>
            Output is: {output}
          </Button>
        </p>
        <p>
          Edit <code>App.tsx</code> and save to test HMR updates.
        </p>
        <p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          {' | '}
          <a
            className="App-link"
            href="https://vitejs.dev/guide/features.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vite Docs
          </a>
        </p>
      </header>
    </div>
  )
}

export default App
