export const renderCartMessages = (totalAmount, keyValuePairs) => {
  // Handle invalid or missing inputs
  if (totalAmount == null || keyValuePairs == null || typeof totalAmount !== "number") {
    return <p style={{ color: "red" }}>Invalid cart details provided!</p>;
  }

  // Ensure keyValuePairs is an object with valid keys
  const sortedKeys = Object.keys(keyValuePairs || {})
    .map(Number)
    .filter((key) => !isNaN(key) && key > 0) // Ensure keys are positive numbers
    .sort((a, b) => a - b);

  if (sortedKeys.length === 0) {
    return <p style={{ color: "red" }}>No discounts available at this time.</p>;
  }

  // If totalAmount is less than the first threshold
  const firstThreshold = sortedKeys[0];
  if (totalAmount < firstThreshold) {
    return (
      <p style={{ color: "orange" }}>
        Add ₹{firstThreshold - totalAmount} more to unlock {keyValuePairs[firstThreshold]}% worth LushioCoins!
      </p>
    );
  }

  // Check conditions for totalAmount based on sorted thresholds
  for (let i = 0; i < sortedKeys.length; i++) {
    const threshold = sortedKeys[i];
    const discount = keyValuePairs[threshold];

    if (totalAmount >= threshold && (i === sortedKeys.length - 1 || totalAmount < sortedKeys[i + 1])) {
      return (
        <p
  style={{
    backgroundColor: "#e6f4ea", // Light green background
    color: "#2d7d46", // Dark green text
    padding: "6px 9px",
    borderRadius: "8px",
    fontWeight: "600",
    margin: "15px 0"
  }}
>
  Great! You will get {discount}% Worth LushioCoins for orders above ₹{threshold}!
</p>

      );
    }
  }

  // If no threshold met (fallback case)
  return <p style={{ color: "red" }}>Shop more to unlock discounts!</p>;
};
