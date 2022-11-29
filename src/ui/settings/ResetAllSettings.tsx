import React, {useState} from "react";
import {Box, Button, Grid, Modal, Typography} from "@mui/material";
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import {createDefault} from "../../hooks/settings";
import {useNavigate} from "react-router-dom";
import {locations} from "../route/locations";
import {modalStyle} from "../modal/megaModal";

export const ResetAllSettings:React.FC = () => {
  const nav = useNavigate()
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  return <>
    <Modal open={show} onClose={handleClose}>
      <Box sx={modalStyle}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant={'h6'} component={'h2'}>⚠️ Reset all settings? ⚠️</Typography>
            <Typography>There&apos;s no going back on this.</Typography>
          </Grid>
          <Grid item xs={6}>
            <Button variant={"outlined"} color="secondary" onClick={handleClose}>
              Close
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              onClick={() => {
                createDefault().then(() => {
                  handleClose();
                  nav(locations.settings.link)
                })
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
