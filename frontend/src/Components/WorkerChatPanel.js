import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useService } from '../../context/ServiceContext';
import { useSocket } from '../../context/SocketContext';
import Message from './Message';

const Chat = () => {
  const { roomId } = useParams();
  const { service } = useService();
  const socketRef = useRef();
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    socketRef.current = useSocket();
    socketRef.current.emit('chat:join', { roomId });

    socketRef.current.on('chat:message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socketRef.current.off('chat:message');
      socketRef.current.emit('chat:leave', { roomId });
    };
  }, [roomId, service]);

  const send = () => {
    const text = msg.trim(); if (!text) return;
    const wkId = service?.workshop || service?.workshopId || workshop?._id;
    const payload = { room, text, sender: { role: 'worker' }, at: Date.now(), serviceId, workshopId: wkId };
    socketRef.current?.emit('chat:message', payload);
    // Do not locally append; rely on server echo
    setMsg('');
  };

  return (
    <div>
      <div>
        {messages.map((m) => (
          <Message key={m.at} {...m} />
        ))}
      </div>
      <input
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && send()}
      />
    </div>
  );
};

export default Chat;