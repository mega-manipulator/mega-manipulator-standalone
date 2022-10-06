import logo from "../../logo.svg";
import {Button} from "react-bootstrap";
import {Command} from "@tauri-apps/api/shell";
import {useEffect, useState} from "react";

export const Settings = () => {
  const [count, setCount] = useState(0)
  const [output, setOutput] = useState('')
  const [isUpdateActive, setIsUpdateActive] = useState(true)

  // TODO: Recommend running script in terminal, and restart
  // sudo launchctl config user path $PATH
  const [env, setEnv] = useState('')
  useEffect(() => {
    new Command(
      "print-env",
      "PATH"
    ).execute()
      .then((commandResult) => setEnv(commandResult.stdout))
  })

  return <>
    <img src={logo} className="App-logo" alt="logo"/>
    <p>Hello Vite + React!</p>
    <p>
      <Button variant={"success"} onClick={() => setCount(count + 1)}>
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
      <ul>
        { env.split( ':').map((it) => <li>{it}</li>) }
      </ul>
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
  </>
};
