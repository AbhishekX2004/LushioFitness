import React, { useState } from "react";
import { Modal, Box, Fade, Backdrop } from "@mui/material";
import BuyNow from "./BuyNow";
const BuyNowModal = ({
  className,
  open,
  handleOpen,
  setOpen,
  product,
  selectedHeight,
  selectedColor,
  selectedSize,
}) => {
  const handleClose = () => setOpen(false);
 const [isActive, setIsActive] = useState(false);
  return (
    <>
     
      <button onClick={handleOpen} className={className}>
        Buy Now
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
             {isActive && (
        <div className="spinner-overlay">
          <div></div>
        </div>
      )}
            <img
              src="/Images/icons/cross.png"
              alt=""
              className="address-modal-close"
              onClick={handleClose}
            />
            <BuyNow
              product={product}
              selectedHeight={selectedHeight}
              selectedColor={selectedColor}
              selectedSize={selectedSize}
              isActive={isActive}
              setIsActive={setIsActive}
            />
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

export default BuyNowModal;
