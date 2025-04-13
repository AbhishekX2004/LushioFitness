import React,{useState} from 'react'
import { Modal, Box, Backdrop, Fade, Button, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
const BuyNow = () => {
    const [buyNowOpen, setBuyNowOpen] = useState(false);
    
  const handleOpen = () => {
    setBuyNowOpen(true);
  };

  const handleClose = () => {
    setBuyNowOpen(false);
  };

  return (
    <div>
       {/* Modal with Fade Transition */}
       <Modal
        open={buyNowOpen}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={buyNowOpen}>
          <Box sx={modalStyle}>
            {/* Close Button */}
            <IconButton onClick={handleClose} sx={{ position: "absolute", top: 10, right: 10 }}>
              <CloseIcon />
            </IconButton>

            {/* Order Summary Content */}
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Order Summary
            </Typography>
            <Typography variant="body1">Your order details will be displayed here.</Typography>
          </Box>
        </Fade>
      </Modal>
    </div>
  )
}
/* Modal Styling */
const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "90%",
    maxWidth: 400,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 3,
    borderRadius: 2,
    outline: "none",
  };
  
export default BuyNow
