import React, { useState, useEffect } from "react";
import axios from "axios";
import SpecialCreditsCard from "./SpecialCreditCards";
import TransactionData from "./TransactionData";
function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [lastDocId, setLastDocId] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uid, setUid] = useState("cczPFmwgtbM2Bna8nFuf5wf9TJb2"); // Assume this is set from context or props
  const limit = 100; // Default limit

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      if (!uid || loading || !hasMore) return;

      setLoading(true);

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/transactions`, {
        uid,
        lastDocId,
        limit,
      });

      const { transactions: newTransactions, hasMore: moreAvailable, lastDocId: newLastDocId } = response.data;
console.log(response.data);
      setTransactions((prev) => [...prev, ...newTransactions]);
      setLastDocId(newLastDocId);
      setHasMore(moreAvailable);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and when UID changes
  useEffect(() => {
    if (uid) fetchTransactions();
  }, []);

  return (
    <div>
      <h2>Transactions</h2>
      <SpecialCreditsCard/>
      {transactions.map((transaction) => (
        <div key={transaction.id} className="transaction-card">
          <p>Type: {transaction.type}</p>
          <p>Amount: {transaction.amount}</p>
          {transaction.type === "coin" && (
            <p>Amount Left: {transaction.amountLeft}</p>
          )}
          <p>Created At: {new Date(transaction.createdAt).toLocaleString()}</p>
        </div>
      ))}

      {hasMore && (
        <button onClick={fetchTransactions} disabled={loading}>
          {loading ? "Loading..." : "Load More"}
        </button>
      )}

      {!hasMore && transactions.length > 0 && <p>No more transactions</p>}
      {transactions.length === 0 && !loading && <p>No transactions found</p>}
    </div>
  );
}

export default Transactions;
