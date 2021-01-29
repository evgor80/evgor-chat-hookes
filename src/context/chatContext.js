import React, { createContext, useReducer } from "react";
import io from "socket.io-client";
import { reducer } from "./reducer";

export const ChatContext = createContext();

const socket = io("/");
const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, {
    socket,
    rooms: [],
    room: null,
    messages: [],
    members: [],
  });

  return (
    <ChatContext.Provider
      value={{
        socket: state.socket,
        rooms: state.rooms,
        room: state.room,
        messages: state.messages,
        members: state.members,
        dispatch,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;
