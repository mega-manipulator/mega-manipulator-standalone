import {Button, Modal} from "react-bootstrap";
import {useContext, useState} from "react";
import {MegaContext} from "../../hooks/MegaContext";

export const ResetAllSettings = () => {
  const context = useContext(MegaContext)
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  return <><Modal show={show} onHide={handleClose}>
    <Modal.Header closeButton>
      <Modal.Title>⚠️ Reset all settings? ⚠️</Modal.Title>
    </Modal.Header>
    <Modal.Body>There's no going back on this.</Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={handleClose}>
        Close
      </Button>
      <Button variant="danger" onClick={() => {
        context.settings.wipe()
        handleClose()
      }}>
        Reset
      </Button>
    </Modal.Footer>
  </Modal>
  <Button variant={"danger"} onClick={handleShow}>Reset all settings to default</Button>
  </>
}
