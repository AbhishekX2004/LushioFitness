 export const sampleTrackingData = [
    {
      trackingId: 'TRK001234567890',
      orderNumber: 'ORD-2024-001',
      estimatedDelivery: '2024-05-25',
      customerName: 'John Doe',
      deliveryAddress: 'Mumbai, Maharashtra',
      shipment_track_activities: [
        {
          "date": "2024-05-22 15:30:00",
          "status": "DLVD",
          "activity": "Package delivered successfully to customer",
          "location": "MUMBAI CENTRAL, Mumbai, MAHARASHTRA",
          "sr-status": "7",
          "sr-status-label": "DELIVERED"
        },
        {
          "date": "2024-05-22 09:15:00",
          "status": "OFD",
          "activity": "Out for delivery - Expected delivery by 6 PM",
          "location": "MUMBAI CENTRAL, Mumbai, MAHARASHTRA",
          "sr-status": "17",
          "sr-status-label": "OUT FOR DELIVERY"
        },
        {
          "date": "2024-05-22 06:30:00",
          "status": "RAD",
          "activity": "Package reached destination hub",
          "location": "MUMBAI CENTRAL, Mumbai, MAHARASHTRA",
          "sr-status": "38",
          "sr-status-label": "REACHED AT DESTINATION"
        },
        {
          "date": "2024-05-21 22:45:00",
          "status": "IT",
          "activity": "Package in transit from Delhi",
          "location": "NEW DELHI, DELHI",
          "sr-status": "18",
          "sr-status-label": "IN TRANSIT"
        },
        {
          "date": "2024-05-21 14:20:00",
          "status": "SHIPPED",
          "activity": "Package dispatched from warehouse",
          "location": "NEW DELHI, DELHI",
          "sr-status": "6",
          "sr-status-label": "SHIPPED"
        },
        {
          "date": "2024-05-21 10:30:00",
          "status": "PICKED_UP",
          "activity": "Package picked up from seller",
          "location": "GURGAON, HARYANA",
          "sr-status": "42",
          "sr-status-label": "PICKED UP"
        },
        {
          "date": "2024-05-21 09:00:00",
          "status": "PROCESSING",
          "activity": "Pickup scheduled and manifest generated",
          "location": "GURGAON, HARYANA",
          "sr-status": "3",
          "sr-status-label": "PICKUP SCHEDULED/GENERATED"
        },
        {
          "date": "2024-05-20 16:45:00",
          "status": "CREATED",
          "activity": "Order created and AWB assigned",
          "location": "GURGAON, HARYANA",
          "sr-status": "1",
          "sr-status-label": "AWB ASSIGNED"
        }
      ]
    },
    {
      trackingId: 'TRK987654321098',
      orderNumber: 'ORD-2024-002',
      estimatedDelivery: '2024-05-24',
      customerName: 'Sarah Wilson',
      deliveryAddress: 'Bangalore, Karnataka',
      shipment_track_activities: [
        {
          "date": "2024-05-22 11:20:00",
          "status": "DELAYED",
          "activity": "Shipment delayed due to weather conditions",
          "location": "BANGALORE, KARNATAKA",
          "sr-status": "22",
          "sr-status-label": "DELAYED"
        },
        {
          "date": "2024-05-22 08:00:00",
          "status": "OFD",
          "activity": "Out for delivery - First attempt",
          "location": "BANGALORE, KARNATAKA",
          "sr-status": "17",
          "sr-status-label": "OUT FOR DELIVERY"
        },
        {
          "date": "2024-05-22 05:45:00",
          "status": "RAD",
          "activity": "Reached destination sorting facility",
          "location": "BANGALORE, KARNATAKA",
          "sr-status": "38",
          "sr-status-label": "REACHED AT DESTINATION"
        },
        {
          "date": "2024-05-21 20:30:00",
          "status": "IT",
          "activity": "In transit from Chennai hub",
          "location": "CHENNAI, TAMIL NADU",
          "sr-status": "18",
          "sr-status-label": "IN TRANSIT"
        },
        {
          "date": "2024-05-21 16:15:00",
          "status": "SHIPPED",
          "activity": "Package shipped from origin",
          "location": "CHENNAI, TAMIL NADU",
          "sr-status": "6",
          "sr-status-label": "SHIPPED"
        },
        {
          "date": "2024-05-21 12:00:00",
          "status": "PROCESSING",
          "activity": "Package packed and ready for dispatch",
          "location": "CHENNAI, TAMIL NADU",
          "sr-status": "63",
          "sr-status-label": "PACKED"
        }
      ]
    },
    {
      trackingId: 'TRK456789012345',
      orderNumber: 'ORD-2024-003',
      estimatedDelivery: '2024-05-23',
      customerName: 'Mike Johnson',
      deliveryAddress: 'Pune, Maharashtra',
      shipment_track_activities: [
        {
          "date": "2024-05-22 14:45:00",
          "status": "RTO_INITIATED",
          "activity": "Return to origin initiated - Customer unavailable",
          "location": "PUNE, MAHARASHTRA",
          "sr-status": "9",
          "sr-status-label": "RTO INITIATED"
        },
        {
          "date": "2024-05-22 10:30:00",
          "status": "UNDELIVERED",
          "activity": "Delivery attempt failed - Customer not available",
          "location": "PUNE, MAHARASHTRA",
          "sr-status": "21",
          "sr-status-label": "UNDELIVERED"
        },
        {
          "date": "2024-05-22 08:15:00",
          "status": "OFD",
          "activity": "Out for delivery - Second attempt",
          "location": "PUNE, MAHARASHTRA",
          "sr-status": "17",
          "sr-status-label": "OUT FOR DELIVERY"
        },
        {
          "date": "2024-05-21 19:00:00",
          "status": "RAD",
          "activity": "Package reached local delivery hub",
          "location": "PUNE, MAHARASHTRA",
          "sr-status": "38",
          "sr-status-label": "REACHED AT DESTINATION"
        },
        {
          "date": "2024-05-21 11:45:00",
          "status": "IT",
          "activity": "Package in transit from Mumbai",
          "location": "MUMBAI, MAHARASHTRA",
          "sr-status": "18",
          "sr-status-label": "IN TRANSIT"
        },
        {
          "date": "2024-05-21 08:30:00",
          "status": "SHIPPED",
          "activity": "Package dispatched from Mumbai hub",
          "location": "MUMBAI, MAHARASHTRA",
          "sr-status": "6",
          "sr-status-label": "SHIPPED"
        }
      ]
    },
    {
      trackingId: 'TRK111222333444',
      orderNumber: 'ORD-2024-004',
      estimatedDelivery: '2024-05-26',
      customerName: 'Lisa Chen',
      deliveryAddress: 'Hyderabad, Telangana',
      shipment_track_activities: [
        {
          "date": "2024-05-22 16:20:00",
          "status": "PROCESSING",
          "activity": "Package being processed at fulfillment center",
          "location": "HYDERABAD, TELANGANA",
          "sr-status": "68",
          "sr-status-label": "PROCESSED AT WAREHOUSE"
        },
        {
          "date": "2024-05-22 13:10:00",
          "status": "PROCESSING",
          "activity": "Package packed and ready for manifest",
          "location": "HYDERABAD, TELANGANA",
          "sr-status": "63",
          "sr-status-label": "PACKED"
        },
        {
          "date": "2024-05-22 09:30:00",
          "status": "PROCESSING",
          "activity": "Picklist generated for order",
          "location": "HYDERABAD, TELANGANA",
          "sr-status": "61",
          "sr-status-label": "PICKLIST GENERATED"
        },
        {
          "date": "2024-05-21 15:20:00",
          "status": "CREATED",
          "activity": "Order confirmed and label generated",
          "location": "HYDERABAD, TELANGANA",
          "sr-status": "2",
          "sr-status-label": "LABEL GENERATED"
        }
      ]
    }
  ];
