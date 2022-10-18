import {useState} from "react";
import {Box, Button, Grid, Modal, Typography} from "@mui/material";
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import {createDefault} from "../../hooks/settings";
import {Link, useNavigate} from "react-router-dom";
import {locations} from "../route/locations";

const style = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export const ResetAllSettings = () => {
  const nav = useNavigate()
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  return <>
    <Modal open={show} onClose={handleClose}>
      <Box sx={style}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant={'h6'} component={'h2'}>⚠️ Reset all settings? ⚠️</Typography>
            <Typography>There's no going back on this.</Typography>
          </Grid>
          <Grid item xs={6}>
            <Button variant={"outlined"} color="secondary" onClick={handleClose}>
              Close
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              onClick={() => {
                nav(locations.settings.link)
                createDefault()
                handleClose()
              }}>
              Reset
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Modal>
    <Button variant={"contained"} color={"error"} onClick={handleShow}>Reset all settings to
      default <DeleteOutlineOutlinedIcon/></Button>
  </>
}
