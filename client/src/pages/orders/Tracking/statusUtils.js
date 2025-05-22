export function getStatusDescription(statusCode) {
  const statusMap = {
    0: "New",
    1: "AWB Assigned",
    2: "Label Generated",
    3: "Pickup Scheduled/Generated",
    4: "Pickup Queued",
    5: "Manifest Generated",
    6: "Shipped",
    7: "Delivered",
    8: "Cancelled",
    9: "RTO Initiated",
    10: "RTO Delivered",
    11: "Pending",
    12: "Lost",
    13: "Pickup Error",
    14: "RTO Acknowledged",
    15: "Pickup Rescheduled",
    16: "Cancellation Requested",
    17: "Out For Delivery",
    18: "In Transit",
    19: "Out For Pickup",
    20: "Pickup Exception",
    21: "Undelivered",
    22: "Delayed",
    23: "Partially Delivered",
    24: "Destroyed",
    25: "Damaged",
    26: "Fulfilled",
    27: "Return Cancelled",
    38: "Reached at Destination",
    39: "Misrouted",
    40: "RTO NDR",
    41: "RTO OFD",
    42: "Picked Up",
    43: "Self Fulfilled",
    44: "DISPOSED_OFF",
    45: "CANCELLED_BEFORE_DISPATCHED",
    46: "RTO_IN_TRANSIT",
    47: "QC Failed",
    48: "Reached Warehouse",
    49: "Custom Cleared",
    50: "In Flight",
    51: "Handed over to Courier",
    52: "Shipment Booked",
    54: "In Transit Overseas",
    55: "Connected Aligned",
    56: "Reached Overseas Warehouse",
    57: "Custom cleared Overseas",
    59: "Box Packing",
    60: "FC Allocated",
    61: "Picklist Generated",
    62: "Ready to Pack",
    63: "Packed",
    67: "FC Manifest Generated",
    68: "Processed At Warehouse",
    71: "Hanover Exception",
    72: "Packed Exception",
    75: "RTO_LOCK",
    76: "UNTRACABLE",
    77: "ISSUE_RELATED_TO_THE_RECIPIENT",
    78: "REACHED_BACK_AT_SELLER_CITY",
  };
  return statusMap[statusCode] || "Unknown Status Code";
}

// Function to map shiprocket status id to application status
export function getOrderStatus(statusId) {
  const shipmentStatusId = Number(statusId);
  const statusGroups = {

    // created
    created: [0],

    // Initial states before processing begins
    pending: [11],

    // Order is being prepared, packed, or in initial logistics steps
    processing: [
      1, 2, 3, 4, 5, 15, 19, 27, 42, 48, 49, 52, 55, 56, 57,
      59, 60, 61, 62, 63, 67, 68,
    ],

    // Order is in transit or out for delivery
    shipped: [6, 18, 38, 50, 51, 54],

    // Out for delivery
    OutForDelivery: [17],

    // Order successfully delivered or fulfilled
    delivered: [7, 26, 43],

    // Order has been cancelled
    cancelled: [8, 16, 45],

    // Order is in return process
    ReturnOrExchanged: [9, 10, 14, 40, 41, 46, 75, 78],

    // Issues with delivery, damage, or other problems
    IssueOccured: [12, 13, 20, 21, 24, 25, 44, 71, 72, 76, 77],

    // Quality Check failed in return
    qcFailed: [47],

    // Order is experiencing delays
    delayed: [22, 39],

    // Only part of the order was delivered
    partially_delivered: [23],
  };

  // Find which application status contains this Shiprocket status code
  for (const [status, codes] of Object.entries(statusGroups)) {
    if (codes.includes(shipmentStatusId)) {
      return status;
    }
  }

  // Default status if not found
  return "processing";
}