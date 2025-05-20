import React, {useContext} from "react";
import { Link } from "react-router-dom";
import { auth } from "../../firebaseConfig.js";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../components/context/UserContext";
import { useCart } from "../../components/context/CartContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./user.css";

function User() {
  const { user } = useContext(UserContext);
  
  // const [userName, setUserName] = useState("");
  const { userName } = useCart();


    

//       try {
     
//        const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/name/${user.uid}`);
     
//   setUserName(response.data.name || "User");
      
        
//       } catch (error) {
//         console.error("Error fetching user data:", error);
//       }
//     };
//     fetchUserData();
  
// }, []);
  const navigate = useNavigate();

  
  const handleLogout = () => {
    // Add confirmation dialog
    const confirmLogout = window.confirm("Are you sure you want to sign out?");
    
    if (confirmLogout) {
      signOut(auth)
        .then(() => {
          toast.success("Logged out Successfully!", {
            position: "top-center",
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: false,
            style: {
              backgroundColor: "#4caf50", // Green background
              color: "#fff",
              fontSize: "1rem",
              padding: "10px 20px",
            },
          });
          setTimeout(() => (window.location.href = "/"), 2000);
        })
        .catch((error) => {
          console.error("Error signing out:", error);
          toast.error("Couldn't Log out, please try again.", {
            position: "top-center",
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: false,
            style: { backgroundColor: "#ff3e3e", color: "#fff" },
          });
        });
    }
  };
  return (
    <>
   <ToastContainer />
   {user && <h1 className="user-greet">Welcome{userName ? `, ${userName}` : ""}</h1>}

      <p className="user-question">What would you like to do?</p>
      <div className="user-action-container">
        <div className="user-action" onClick={() => { navigate("/user-editProfile") }}>
          <Link to="/user-editProfile">
            <img
              src="/Images/icons/editProfile.png"
              alt="logo"
            />
          </Link>
          <div className="action-details">
            <h3>Edit Profile</h3>
            <p>Edit personal info, change password</p>
          </div>
        </div>

        <div className="user-action" onClick={() => { navigate("/") }}>
          <Link to="/">
            <img
              src="/Images/icons/continueShopping.png"
              alt="logo"
            />
          </Link>
          <div className="action-details">
            <h3>Keep Shopping</h3>
            <p>Go to Home page</p>
          </div>
        </div>
        <div className="user-action" onClick={() => { navigate("/user/orders") }}>
          <Link to="/user-orders">
            <img src="/Images/icons/orders.png" alt="logo" />
          </Link>
          <div className="action-details">
            <h3>Your Orders</h3>
            <p>Track, return, or buy things again</p>
          </div>
        </div>

        <div className="user-action" onClick={() => { navigate("/user-address") }}>
          <Link to="/user-address">
            <img src="/Images/icons/address.png" alt="logo" />{" "}
          </Link>

          <div className="action-details">
            <h3>My Addresses</h3>
            <p>Add, Remove or change your default address</p>
          </div>
        </div>
        <div className="user-action" onClick={() => { navigate("/user-referAndEarn") }}>
          <Link to="/user-referAndEarn">
            <img src="/Images/icons/referEarn.png" alt="logo" />{" "}
          </Link>

          <div className="action-details">
            <h3>Refer and Earn</h3>
            <p>Refer to your friends, family members</p>
          </div>
        </div>
        <div className="user-action" onClick={handleLogout}>
          <img src="/Images/icons/logout.png" alt="Sign Out" />
          <div className="action-details">
            <h3>Sign Out</h3>
            <p>Sign out from your account</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default User;
