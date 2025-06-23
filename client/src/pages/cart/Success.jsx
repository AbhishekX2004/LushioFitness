import React from "react";
import { Dialog, DialogContent, Typography } from "@mui/material";
import { FaCheckCircle } from "react-icons/fa";

const Success = ({successOpen,setSuccessOpen}) => {
  //const [successOpen, setSuccessOpen] = useState(false);

  // const handleOpen = () => {
  //   setSuccessOpen(true);
  //   setTimeout(() => setSuccessOpen(false), 4000); 
  // };

  return (
    <div style={{ textAlign: "center", marginTop: "5px" }}>
    
      <Dialog
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        PaperProps={{
          style: {
            borderRadius: "20px",
            padding: "20px",
            textAlign: "center",
            animation: "popupAnimation 0.5s ease-out",
          },
        }}
      >
        <DialogContent>
          <FaCheckCircle
            color="#4caf50"
            size={60}
            style={{
              animation: "pulse 1.5s infinite",
            }}
          />
          <Typography
            variant="h5"
            style={{
              marginTop: "20px",
              fontWeight: "bold",
              color: "#333",
            }}
          >
          Order Placed Successfully!
          </Typography>
        </DialogContent>
      </Dialog>

      <style>
        {`
          @keyframes popupAnimation {
            from {
              transform: scale(0.5);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }

          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.1);
            }
          }
        `}
      </style>
    </div>
  );
};

export default Success;
