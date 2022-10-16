import {useContext, useState} from "react";
import {MegaContext} from "../../hooks/MegaContext";
import {Box, Button, Modal, Typography} from "@mui/material";

export const ResetAllSettings = () => {
  const context = useContext(MegaContext)
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  return <><Modal open={show} onClose={handleClose}>
    <Box>
    <Typography variant={'h6'} component={'h2'}>⚠️ Reset all settings? ⚠️</Typography>
    <Typography>There's no going back on this.</Typography>
    <Button color="secondary" onClick={handleClose}>
      Close
    </Button>
    <Button color="error" onClick={() => {
      context.settings.wipe()
      handleClose()
    }}>
      Reset
    </Button>
    </Box>
  </Modal>
  <Button variant={"contained"} color={"error"} onClick={handleShow}>Reset all settings to default</Button>
  </>
}
