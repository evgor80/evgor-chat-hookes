import MessageInput from "./MessageInput";
import Message from "./Message";
import { useLocation, useHistory } from "react-router-dom";
import { ChatContext } from "./../context/chatContext";
import React, { useContext, useEffect, useState, createRef } from "react";

//окно чата с полем добавления сообщений

export default function Chat() {
  const username = sessionStorage.username;
  let roomName = useLocation().pathname.slice(1);
  let history = useHistory();
  const { socket, messages, members, room, dispatch } = useContext(ChatContext);
  const [typing, setTyping] = useState({
    action: false,
    user: "",
  });
  const [messagesCount, setMessagesCount] = useState(0);
  let messagesList = createRef();

  //подписка на события сокета
  //отписка от событий при переходе на другую страницу
  useEffect(() => {
    const conn_sound = new Audio("/sounds/connect.mp3");
    const typing_sound = new Audio("/sounds/typing.mp3");
    const msg_sound = new Audio("/sounds/message.mp3");
    const username = sessionStorage.username;

    //уведомляем сервер, что пользователь вошел в чат
    socket.emit("user-join", {
      type: "join",
      room: roomName,
      token: sessionStorage.token,
    });

    //переподписка на чат в случае потери связи
    socket.on("reconnect", () => {
      socket.emit("user-join", {
        type: "join",
        room: roomName,
        token: sessionStorage.token,
      });
    });

    //сообщаем о выходе при закрытии браузера
    window.addEventListener("unload", () => {
      socket.emit("user-leave", {
        type: "leave",
        user: username,
        room: roomName,
      });
    });

    //получаем список всех сообщений в чате
    socket.on("welcome", (data) => {
      dispatch({ type: "ADD_ROOM", room: data });
      setMessagesCount(data.messages.length);
    });
    //в случае неудачной аутентификации возвращаем
    //пользователя на страницу регистрации/входа в систему
    socket.on("expired", () => {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("username");
      history.push({
        pathname: "/enter",
        state: {
          err: "Время сеанса истекло. Войдите в систему повторно",
        },
      });
    });

    //при попытке получить доступ к закрытому чату без пароля
    //возвращаем на страницу со списком чатов
    socket.on("access-denied", () => {
      history.push({
        pathname: "/",
        state: {
          error: "Вход в этот чат защищен паролем",
        },
      });
    });

    //при получении нового сообщения обновляем список и счетчик сообщений
    socket.on("message-broadcast", (data) => {
      dispatch({ type: "ADD_MESSAGE", message: data });
      setMessagesCount((count) => count + 1);
      msg_sound.play();
    });
    //при входе нового пользователя в чат обновляем список участников
    //и добавляем соответствующее сообщение
    socket.on("user-join", (data) => {
      dispatch({ type: "ADD_MESSAGE", message: data.message });
      dispatch({ type: "UPDATE_MEMBERS", members: data.members });
      conn_sound.play();
    });
    //при выходе пользователя из чата обновляем список участников
    //и добавляем соответствующее сообщение
    socket.on("user-leave", (data) => {
      dispatch({ type: "ADD_MESSAGE", message: data.message });
      dispatch({ type: "UPDATE_MEMBERS", members: data.members });
      conn_sound.play();
    });
    //показываем, что пользователь печатает
    socket.on("user-typing", (data) => {
      setTyping({
        action: true,
        user: data.user,
      });
      typing_sound.play();
      setTimeout(() => {
        setTyping({
          action: false,
          user: "",
        });
      }, 1000);
    });
    return () => {
      //уведомляем сервер о своем выходе из чата и отписываемся от всех событий сокета
      socket.emit("user-leave", {
        type: "leave",
        user: username,
        room: roomName,
      });
      socket.removeListener("access-denied");
      socket.removeListener("expired");
      socket.removeListener("welcome");
      socket.removeListener("message-broadcast");
      socket.removeListener("user-join");
      socket.removeListener("user-leave");
      socket.removeListener("user-typing");
      socket.removeListener("reconnect");
      window.removeEventListener("unload");

      dispatch({ type: "ROOM_LEAVE" });
    };
  }, [dispatch, history, socket, roomName]);

  //прокручиваем список сообщений вниз, к самым последним сообщениям
  useEffect(() => {
    messagesList.current.scrollTop = messagesList.current.scrollHeight;
  }, [messagesList]);

  //отправка нового сообщения в чат
  function msgSubmit(msg) {
    const msgObj = {
      message: {
        type: "message",
        author: { username },
        text: msg,
        createdAt: Date.now(),
      },
      room: roomName,
    };
    socket.emit("message", msgObj);
  }

  //уведомляем сервер о наборе сообщения
  function onTyping() {
    socket.emit("user-typing", {
      type: "typing",
      user: username,
      room: roomName,
    });
  }

  return (
    <div className="chat">
      <section className="chat__head">
        <div className="chat__name">
          <span>{room && room.name}</span>
        </div>
        <div className="chat__info">
          <span>
            <i className="fa fa-users"></i> {members && members.length} /
            <i className="fa fa-comment"></i> {messagesCount}
          </span>
        </div>
      </section>
      <section className="chat__messages" ref={messagesList}>
        <ul>
          {messages.map((message) => (
            <Message message={message} key={message._id} user={username} />
          ))}
        </ul>
      </section>
      <div className="typing__wrapper">
        {typing.action && (
          <div className="typing__event">
            <span>{typing.user} печатает</span>
          </div>
        )}
      </div>
      <MessageInput msgSubmit={msgSubmit} type={onTyping} />
    </div>
  );
}
