import React, { useState, useEffect, useRef } from "react";
import "./chat.css";
import "./home.css";
import axios from "axios";
import io from "socket.io-client";
import EmojiPicker from "emoji-picker-react";

const ENDPOINT = "http://localhost:8890";
let socket;
const Msbot = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // State to toggle emoji picker

  const chatboxRef = useRef(null);

  useEffect(() => {
    socket = io(ENDPOINT);
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
      const { data } = await axios.get("http://localhost:8890/allMessages");
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

  const handleSendButton = async (action = "send") => {
    const userText = userInput.trim();
    if (userText !== "") {
      setUserInput("");
      const content = {
        sender: "user",
        content: userText,
        timestamp: getTime(),
      };
      const { data } = await axios.post(
        "http://localhost:8890/customerMessage",
        content
      );
      setChatMessages((prevMessages) => [...prevMessages, content]);
    }
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

  useEffect(() => {
    if (chatboxRef.current) {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className="chat-bar-collapsible">
      <button
        id="chat-button"
        type="button"
        className={`collapsible ${chatOpen ? "active" : ""}`}
        onClick={handleToggleChat}
      >
        Chat with us!
      </button>

      {chatOpen && (
        <div className="full-chat-block">
          <div className="outer-container">
            <div className="chat-container">
              <div
                id="chatbox"
                ref={chatboxRef}
                style={{ maxHeight: "450px", overflowY: "scroll" }}
              >
                {renderChatMessages()}
              </div>

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

              {/* Emoji Picker Component */}
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
};

export default Msbot;
