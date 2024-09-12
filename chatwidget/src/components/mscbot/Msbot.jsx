import React, { useState, useEffect, useRef } from "react";
import "./chat.css";
import "./home.css";
import axios from "axios";
import io from "socket.io-client";
import EmojiPicker from "emoji-picker-react";
import CryptoJS from "crypto-js"; // Import crypto-js for hashing

const ENDPOINT = "http://localhost:8890";
let socket;

const Msbot = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    contact: "",
    email: "",
  });
  const [error, setError] = useState("");

  const [isRegistered, setIsRegistered] = useState(false); // Flag for customer registration
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Emoji picker toggle

  const chatboxRef = useRef(null);

  useEffect(() => {
    const storedCustomerInfo = localStorage.getItem("customerInfo");
    if (storedCustomerInfo) {
      setCustomerInfo(JSON.parse(storedCustomerInfo));
      setIsRegistered(true);
    }
    socket = io(ENDPOINT, {
      path: "/widgetsocket.io",
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleMessageReceived = (newMessageRecieved) => {
      setChatMessages((prevMessages) => [...prevMessages, newMessageRecieved]);
    };
    socket.on("message received", handleMessageReceived);

    return () => {
      socket.off("message received", handleMessageReceived);
    };
  }, [socket]);

  useEffect(() => {
    const getChatData = async () => {
      const { data } = await axios.get(ENDPOINT + "/allMessages");
      if (data && data.status === false) {
        setChatMessages([]);
      }
      if (data.status) {
        setChatMessages(data.data);
      }
    };
    getChatData();
  }, []);

  const handleToggleChat = () => {
    setChatOpen(!chatOpen);
  };

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSendButton();
    }
  };

  const handleSendButton = async () => {
    const userText = userInput.trim();
    if (userText !== "" && isRegistered) {
      setUserInput("");
      const content = {
        sender: "customer",
        customerInfo: {
          name: customerInfo.name,
          mobile: customerInfo.contact,
          email: customerInfo.email,
        },
        ChatId: generateUniqueChatId(customerInfo.contact, customerInfo.email),
        content: userText,
        timestamp: getTime(),
      };
      await axios.post(ENDPOINT + "/customerMessage", content);
      setChatMessages((prevMessages) => [...prevMessages, content]);
    }
  };
  // Function to generate a unique ChatId based on contact and email
  const generateUniqueChatId = (contact, email) => {
    const combined = `${contact}-${email}`;
    const hash = CryptoJS.SHA256(combined).toString(CryptoJS.enc.Base64); // Create a hash and encode it to Base64
    return "web-" + hash.substring(0, 16); // Ensure ChatId is no longer than 16 characters
  };
  const handleEmojiClick = (emojiData) => {
    setUserInput(userInput + emojiData.emoji);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const getTime = () => {
    let today = new Date();
    let hours = today.getHours();
    let minutes = today.getMinutes();
    if (hours < 10) hours = "0" + hours;
    if (minutes < 10) minutes = "0" + minutes;
    return hours + ":" + minutes;
  };

  const renderChatMessages = () => {
    return chatMessages?.map((message, index) => (
      <div key={index}>
        <h5 className="chat-timestamp">{message.timestamp}</h5>
        <p className={message.sender === "bot" ? "botText" : "userText"}>
          <span>{message.content}</span>
        </p>
      </div>
    ));
  };

  const handleRegisterCustomer = () => {
    const { name, contact, email } = customerInfo;

    // Validate the inputs
    if (!name) {
      setError("Name is mandatory");
      return;
    }

    if (!contact && !email) {
      setError("Either contact or email is required");
      return;
    }

    // Clear previous error and proceed with registration
    setError("");

    // Save customer info to local storage
    localStorage.setItem("customerInfo", JSON.stringify(customerInfo));

    // Set registration status
    setIsRegistered(true);
  };

  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [chatMessages]);
  return (
    <div className="chat-bar-collapsible">
      {!chatOpen ? (
        <button
          id="chat-button"
          type="button"
          className="collapsible collapsed"
          onClick={handleToggleChat}
        >
          <i className="fas fa-message"></i>
        </button>
      ) : (
        <button
          id="chat-button-expanded"
          type="button"
          className={`collapsible ${chatOpen ? "active" : ""}`}
          onClick={handleToggleChat}
        >
          Chat with us!
        </button>
      )}

      {chatOpen && (
        <div className="full-chat-block">
          <div className="outer-container">
            <div className="chat-container">
              <div
                id="chatbox"
                ref={chatboxRef}
                style={{ maxHeight: "450px", overflowY: "scroll" }}
              >
                {!isRegistered ? (
                  <div className="registration-form">
                    <h2>Register to Chat</h2>
                    <input
                      type="text"
                      placeholder="Name"
                      value={customerInfo.name}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          name: e.target.value,
                        })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Contact"
                      value={customerInfo.contact}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          contact: e.target.value,
                        })
                      }
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={customerInfo.email}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          email: e.target.value,
                        })
                      }
                    />
                    {error && <p className="error-message">{error}</p>}
                    <button onClick={handleRegisterCustomer}>Register</button>
                  </div>
                ) : (
                  <>{renderChatMessages()}</>
                )}
              </div>

              {isRegistered && (
                <div className="chat-bar-input-block">
                  <div id="userInput">
                    <input
                      id="textInput"
                      className="input-box"
                      type="text"
                      name="msg"
                      placeholder="Tap 'Enter' to send a message"
                      value={userInput}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                    />
                  </div>

                  <div className="chat-bar-icons">
                    <i
                      id="chat-icon"
                      style={{ color: "#013542" }}
                      className="fas fa-face-smile"
                      onClick={toggleEmojiPicker}
                    ></i>
                    <i
                      id="chat-icon"
                      style={{ color: "#013542" }}
                      className="fas fa-paper-plane"
                      onClick={handleSendButton}
                    ></i>
                  </div>
                </div>
              )}

              {showEmojiPicker && (
                <div className="emoji-picker-container">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}

              <div id="chat-bar-bottom">
                <p></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // return (
  //   <div className="chat-bar-collapsible">
  //     <button
  //       id="chat-button"
  //       type="button"
  //       className={`collapsible ${chatOpen ? "active" : ""}`}
  //       onClick={handleToggleChat}
  //     >
  //       Chat with us!
  //     </button>

  //     {chatOpen && (
  //       <div className="full-chat-block">
  //         <div className="outer-container">
  //           <div className="chat-container">
  //             <div
  //               id="chatbox"
  //               ref={chatboxRef}
  //               style={{ maxHeight: "450px", overflowY: "scroll" }}
  //             >
  //               {!isRegistered ? (
  //                 <div className="registration-form">
  //                   <h2>Register to Chat</h2>

  //                   <input
  //                     type="text"
  //                     placeholder="Name"
  //                     value={customerInfo.name}
  //                     onChange={(e) =>
  //                       setCustomerInfo({
  //                         ...customerInfo,
  //                         name: e.target.value,
  //                       })
  //                     }
  //                   />
  //                   <input
  //                     type="text"
  //                     placeholder="Contact"
  //                     value={customerInfo.contact}
  //                     onChange={(e) =>
  //                       setCustomerInfo({
  //                         ...customerInfo,
  //                         contact: e.target.value,
  //                       })
  //                     }
  //                   />
  //                   <input
  //                     type="email"
  //                     placeholder="Email"
  //                     value={customerInfo.email}
  //                     onChange={(e) =>
  //                       setCustomerInfo({
  //                         ...customerInfo,
  //                         email: e.target.value,
  //                       })
  //                     }
  //                   />
  //                    {error && <p className="error-message">{error}</p>}
  //                   <button onClick={handleRegisterCustomer}>
  //                     Register
  //                   </button>
  //                 </div>
  //               ) : (
  //                 <>
  //                   {renderChatMessages()}
  //                 </>
  //               )}
  //             </div>

  //             {isRegistered && (
  //               <div className="chat-bar-input-block">
  //                 <div id="userInput">
  //                   <input
  //                     id="textInput"
  //                     className="input-box"
  //                     type="text"
  //                     name="msg"
  //                     placeholder="Tap 'Enter' to send a message"
  //                     value={userInput}
  //                     onChange={handleInputChange}
  //                     onKeyPress={handleKeyPress}
  //                   />
  //                 </div>

  //                 <div className="chat-bar-icons">
  //                   <i
  //                     id="chat-icon"
  //                     style={{ color: "#013542" }}
  //                     className="fas fa-face-smile"
  //                     onClick={toggleEmojiPicker}
  //                   ></i>
  //                   <i
  //                     id="chat-icon"
  //                     style={{ color: "#013542" }}
  //                     className="fas fa-paper-plane"
  //                     onClick={handleSendButton}
  //                   ></i>
  //                 </div>
  //               </div>
  //             )}

  //             {showEmojiPicker && (
  //               <div className="emoji-picker-container">
  //                 <EmojiPicker onEmojiClick={handleEmojiClick} />
  //               </div>
  //             )}

  //             <div id="chat-bar-bottom">
  //               <p></p>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );
};

export default Msbot;
