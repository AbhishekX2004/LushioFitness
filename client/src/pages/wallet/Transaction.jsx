import React, { useState, useEffect,useContext } from "react";
import axios from "axios";
import SpecialCreditsCard from "./SpecialCreditCards";
import { useParams } from 'react-router-dom';
import { UserContext } from "../../components/context/UserContext";
function Transactions() {
  const [allTransactions, setAllTransactions] = useState([]);
  const [displayedTransactions, setDisplayedTransactions] = useState([]);
  const [lastDocId, setLastDocId] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(UserContext);
  const [uid] = useState("cczPFmwgtbM2Bna8nFuf5wf9TJb2");
  const limit = 5;
  const { type = 'coin' } = useParams();

  // Filter transactions based on type
  const filterTransactions = (transactions, filterType) => {
    return transactions.filter(transaction => {
      if (filterType === 'coin') {
        return transaction.type === 'coin';
      }
      if (filterType === 'cash') {
        return transaction.type === 'cash_credit' || transaction.type === 'cash_usage';
      }
      return false;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  // Fetch transactions from API
  const fetchTransactions = async () => {
    try {
      if (!uid || loading || !hasMore) return;

      setLoading(true);
      setError(null);

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/transactions`, {
        uid: user?.uid,
        lastDocId,
        limit,
      });

      const { transactions: newTransactions, hasMore: moreAvailable, lastDocId: newLastDocId } = response.data;
console.log(response.data.transactions);
      // Filter out duplicates
      const uniqueNewTransactions = newTransactions.filter(newTransaction => 
        !allTransactions.some(existingTransaction => 
          existingTransaction.id === newTransaction.id
        )
      );

      // Update all transactions
      const updatedAllTransactions = [...allTransactions, ...uniqueNewTransactions];
      setAllTransactions(updatedAllTransactions);
      
      // Update displayed transactions based on current type
      setDisplayedTransactions(filterTransactions(updatedAllTransactions, type));
      
      setLastDocId(newLastDocId);
      setHasMore(moreAvailable);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("Failed to load transactions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reset and fetch when type changes
  useEffect(() => {
    setAllTransactions([]);
    setDisplayedTransactions([]);
    setLastDocId(null);
    setHasMore(true);
    fetchTransactions();
  }, [type]);

  // Update displayed transactions when allTransactions or type changes
  useEffect(() => {
    setDisplayedTransactions(filterTransactions(allTransactions, type));
  }, [allTransactions, type]);
 if(loading && allTransactions.length===0){
    return (
      <div className="loader-container">
        {" "}
        <span className="loader"></span>
      </div>
    );
  }
  return (
    <>
      
    <div className="transactions-container">
      {/* <h2>Transactions ({type})</h2> */}
     <div className="wallet-title">
            <h2>Transactions </h2>
            <hr />
          </div>
      {error && <p className="error">{error}</p>}
      
      {displayedTransactions.length > 0 ? (
        displayedTransactions.map(transaction => (
          <SpecialCreditsCard 
            key={transaction.id} 
            transaction={transaction} 
          />
        ))
      ) : (
        !loading && <p>No transactions found</p>
      )}

      {hasMore && (
        <button 
        onClick={fetchTransactions} 
        disabled={loading}  
        className="order-load-more-button transaction-button">
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div></>
  );
}

export default Transactions;