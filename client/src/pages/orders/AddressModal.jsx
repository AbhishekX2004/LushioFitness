import React,{useState} from "react";
import { Modal, Box, Fade, Backdrop } from "@mui/material";
import AddressSelection from "./AddressSelection"
const AddressModal = ({orderId})=> {
  const [open, setOpen] = useState(false);
  const handleClose = () => setOpen(false);
 const handleOpen = () => {
        setOpen(true);
  };
 
  return (
    <div>
     <button onClick={handleOpen} className="final-submit-button">
       Update Delivery Address
      </button>
      <p>⚠️ Address can be updated only if item is not shipped</p>
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
orderId={orderId}
/>


          </Box>
        </Fade>
      </Modal>
    </div>
  );
}

export default AddressModal;
