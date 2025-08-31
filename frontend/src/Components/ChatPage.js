import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const ChatComponent = ({ service, workshop, myRole }) => {
  const [msg, setMsg] = useState('');
  const [room, setRoom] = useState('');
  const socketRef = useRef();

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io('YOUR_SERVER_URL');

    return () => {
      // Cleanup on unmount
      socketRef.current.disconnect();
    };
  }, []);

  const send = () => {
    const text = msg.trim();
    if (!text) return;
    const wkId = service?.workshop || service?.workshopId || workshop?._id;
    const payload = { room, text, sender: { role: myRole }, at: Date.now(), serviceId, workshopId: wkId };
    socketRef.current?.emit('chat:message', payload);
    // Do not locally append; wait for server echo to avoid dupes
    setMsg('');
  };

  return (
    <div>
      <div id="messagesContainer">
        {/* Messages will be rendered here */}
      </div>
      <input
        type="text"
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="Type your message..."
      />
      <button onClick={send}>Send</button>
    </div>
  );
};

export default ChatComponent;