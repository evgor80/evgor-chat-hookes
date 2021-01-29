import { createRef, useState } from "react";
import emojis from "../utils/emojis";

//поле для ввода нового сообщения в окне чата

export default function MessageInput({ msgSubmit, type }) {
  const [message, setMessage] = useState("");
  const [emojisWindow, setEmojisWindow] = useState(false);
  const messageInput = createRef();

  //отправка сообщения в чат
  function submit() {
    if (message.trim().length >= 1) {
      setEmojisWindow(false);
      msgSubmit(message);
      setMessage("");
    }
  }
  //обработка нажатия Enter вместо кнопки отправки
  function enterPress(e) {
    if (e.key === "Enter") {
      submit();
    }
  }
  //добавление смайла в текст сообщения
  //и закрытие окна с набором смайлов
  function addEmoji(i) {
    setMessage((msg) => msg + " " + emojis[i]["symbol"] + " ");
    setEmojisWindow(false);
    messageInput.current.focus();
  }

  return (
    <section className="msg-form">
      <textarea
        ref={messageInput}
        name=""
        rows="3"
        placeholder="Введите свое сообщение"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          type();
        }}
        onKeyUp={enterPress}
      ></textarea>
      <button
        className="msg-form__emoji-button"
        onClick={() => setEmojisWindow((state) => !state)}
      >
        <img src="/emoji/slightly-smiling-face.png" alt="" />
      </button>
      <button className="msg-form__submit-button" onClick={submit}>
        <i className="fa fa-paper-plane"></i>
      </button>
      {emojisWindow && (
        <>
          <ul className="emojis">
            {emojis.map((emoji, index) => (
              <li key={emoji.name}>
                <button className="emoji" onClick={() => addEmoji(index)}>
                  <img src={`/emoji/${emoji.name}.png`} alt="" />
                </button>
              </li>
            ))}
          </ul>
          <button
            className="emojis__close"
            onClick={() => {
              setEmojisWindow((state) => !state);
              messageInput.current.focus();
            }}
          >
            <span>X</span>
          </button>
        </>
      )}
    </section>
  );
}
