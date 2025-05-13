import React, { useEffect, useState } from "react";
import axios from "axios";

const TrackingDetails = ({ oid, uid }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [statusDesc, setStatusDesc] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTrackingData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/orders/${oid}?uid=${uid}`);
        setTrackingData(response.data.tracking_data);
        setStatusDesc(response.data.status_description);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to fetch tracking data");
      } finally {
        setLoading(false);
      }
    };

    if (oid && uid) {
      fetchTrackingData();
    }
  }, [oid, uid]);

  if (loading) return <p>Loading tracking information...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!trackingData) return <p></p>;

  const trackingId = Object.keys(trackingData)[0];
  const events = trackingData[trackingId]?.tracking_data?.track_activities || [];
  const awbCode = trackingData[trackingId]?.awb;
  const shipmentId = trackingData[trackingId]?.shipment_id;

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "auto" }}>
      <h2>Tracking Details</h2>
      <p><strong>AWB Code:</strong> {awbCode || "N/A"}</p>
      <p><strong>Shipment ID:</strong> {shipmentId || "N/A"}</p>
      <p><strong>Current Status:</strong> {statusDesc}</p>

      <h3 style={{ marginTop: "20px" }}>Tracking History</h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {events.length === 0 && <li>No tracking history available.</li>}
        {events.map((event, index) => (
          <li key={index} style={{ marginBottom: "15px", borderLeft: "2px solid black", paddingLeft: "10px" }}>
            <div><strong>Date:</strong> {event.date}</div>
            <div><strong>Status:</strong> {event.activity}</div>
            {event.location && <div><strong>Location:</strong> {event.location}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TrackingDetails;
