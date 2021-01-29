import { ChatContext } from "../context/chatContext";
import { useContext } from "react";
import beautifyDate from "../utils/beautifyDate"
import emojis from "../utils/emojis"


//отдельное сообщение в окне чата

export default function Message({message, user}) {
  const { members } = useContext(ChatContext);
  
  //назначаем цвет для аватара пользователя
  function userAvatar (author) {
    const color = [
      "#3399ff",
      "#00ffff",
      "#ffcc00",
      "#99ff33",
      "#009900",
      "#0066ff",
      "#cc0066",
      "#ff0066",
      "#6600ff",
      "#00cc66",
    ];
    let hash = 0;
    for (let symbol of author) {
      hash += symbol.charCodeAt(0);
    }
    hash = hash % 10;
    return {backgroundColor: color[hash] };
  }

  //отображение изображений смайлов в тексте сообщения
  function showEmojis(message) {
    emojis.forEach((emoji) => {
      let re = new RegExp(emoji.symbol, "g");
      message = message.replace(
        re,
        `<img src="/emoji/${emoji.name}.png" class="msg__smile" alt=""/>`
      );
    });
    return {__html: message};
  }

  return (
    <li className="msg">
      {message.type === "message" && (
        <div
          className={"msg__message " +
            (message.author.username === user
              ? "msg__message--mine"
              : "")
          }
        >
          <div className="msg__author" style={message.author.username !== user
            ? userAvatar(message.author.username)
            : null}>
            <span>{message.author.username.charAt(0).toUpperCase()}</span>
            {message.author.username !== user && <div className="msg__author-name">{message.author.username}</div>}
            <div
              className={
                "msg__author-status " +
                (members.includes(message.author.username)
                  ? "msg__author-status--online"
                  : "msg__author-status--offline")
              }
            ></div>
          </div>
          <div className="msg__body">
            <div
              className={
                message.author.username === user
                  ? "msg__text--mine"
                  : "msg__text"
              }
            >
              <span dangerouslySetInnerHTML={showEmojis(message.text)}></span>
            </div>
            <div className="msg__time">
              <span>{beautifyDate(message.createdAt)}</span>
            </div>
          </div>
        </div>
      )}
      {(message.type === "join" || message.type === "leave") && (
        <div className="msg__notification">
          <span>
            {message.user}
            {message.type === "join" ? " входит в" : " покидает"} чат
          </span>
        </div>
      )}
    </li>
  );
}
