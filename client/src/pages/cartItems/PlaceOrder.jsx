import React,{useState} from "react";
import { Modal, Box, Fade, Backdrop } from "@mui/material";
import AddressSelection from "./AddressSelection"
const PlaceOrder = ({setCartAddress})=> {
  const [open, setOpen] = useState(false);
  const handleClose = () => setOpen(false);
 const handleOpen = () => {
        setOpen(true);
  };
 
  return (
    <div>
     <button onClick={handleOpen} className="address-selection-button open-rating-button">
       Change
      </button>
      <Modal
        open={open}
        onClose={handleClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={open}>
          <Box
           className="address-modal"
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            
              padding: "0px",
              bgcolor: "background.paper",
              border: ".5px solid #000",
              borderRadius: "5px",
              boxShadow: 24,
              p: 4,
            }}
          >
            <img
              src="/Images/icons/cross.png"
              alt=""
              className="address-modal-close"
              onClick={handleClose}
            />
<AddressSelection 
handleClose={handleClose}
setCartAddress={setCartAddress}/>


          </Box>
        </Fade>
      </Modal>
    </div>
  );
}

export default PlaceOrder;
