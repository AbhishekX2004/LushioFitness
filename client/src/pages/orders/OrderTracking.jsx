import React from "react";
import axios from 'axios';
import { toast } from 'react-toastify'; 
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Avatar,
} from "@mui/material";
import {
  CheckCircleOutline as CheckCircleIcon,
  HighlightOff as CancelIcon,
  LocalShipping as DeliveryIcon,
  ShoppingCart as CartIcon,
} from "@mui/icons-material";

const OrderTracking = ({ status }) => {

 
  const stages = [
    { label: "Order Placed", icon: <CartIcon />, key: "Order Placed" },
    { label: "Order Confirmed", icon: <CheckCircleIcon />, key: "Order Confirmed" },
    { label: "Out for Delivery", icon: <DeliveryIcon />, key: "Out for Delivery" },
    { label: "Delivered", icon: <CheckCircleIcon />, key: "Delivered" },
  ];

  const statusIndex = stages.findIndex((stage) => stage.key === status);
  const isCancelled = status === "Cancelled";

  return (
    <>
    <Box
      sx={{
        maxWidth: 400,
        margin: "20px auto",
        padding: 2,
        border: "1px solid #ddd",
        borderRadius: "10px",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
        background: "#fff",
      }}
    >
      <Typography
        variant="h5"
        textAlign="center"
        gutterBottom
        sx={{ fontWeight: "bold", color: "#4CAF50" }}
      >
        Order Tracking
      </Typography>
      <Stepper
        activeStep={isCancelled ? stages.length - 1 : statusIndex}
        orientation="vertical"
        connector={null}
        sx={{ padding: 2 }}
      >
        {stages.map((stage, index) => {
          const isCompleted = index < statusIndex && !isCancelled;
          const isCurrent = index === statusIndex && !isCancelled;
          const isCancelledStage = isCancelled && index === statusIndex;

          return (
            <Step key={stage.key}>
             
              <StepLabel
                StepIconComponent={() => (
                  <Avatar
                    sx={{
                      backgroundColor: isCancelledStage
                        ? "red"
                        : isCompleted
                        ? "green"
                        : isCurrent
                        ? "blue"
                        : "#ddd",
                      color: "#fff",
                      width: 40,
                      height: 40,
                    }}
                  >
                    {isCancelledStage ? <CancelIcon /> : stage.icon}
                  </Avatar>
                )}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    marginLeft: 2,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: isCurrent || isCompleted ? "bold" : "normal",
                      color: isCancelledStage
                        ? "red"
                        : isCompleted || isCurrent
                        ? "green"
                        : "gray",
                    }}
                  >
                    {stage.label}
                  </Typography>
                  {isCancelledStage && (
                    <Typography sx={{ fontSize: "0.85rem", color: "red" }}>
                      Order Cancelled
                    </Typography>
                  )}
                </Box>
              </StepLabel>
              <StepContent>
                <Box
                  sx={{
                    height: "3px",
                    width: "100%",
                    backgroundColor: isCancelledStage
                      ? "red"
                      : isCompleted
                      ? "green"
                      : "gray",
                  }}
                />
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  </>
  );
};

export default OrderTracking;
