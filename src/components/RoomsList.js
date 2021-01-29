import { useContext, useEffect, useState } from "react";
import { useHistory, Link, useLocation } from "react-router-dom";
import axios from "axios";
import Room from "./Room";
import { ChatContext } from "./../context/chatContext";
import PasswordInput from "./PasswordInput";

//домашняя страница со списком доступных чатов
//отобрражается только аутентифицированным пользователям

export default function RoomsList() {
  let history = useHistory();
  let location = useLocation();

  //проверка токена при загрузке
  // при его отсутствии или истечении срока действия перенаправление на страницу входа/регистрации

  useEffect(() => {
    if (sessionStorage.token) {
      const token = sessionStorage.token.split(" ")[1];
      const payload = JSON.parse(atob(token.split(".")[1]));

      if (payload.exp > Date.now() / 1000) {
        return;
      } else {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("username");
        history.push({
          pathname: "/enter",
          state: { err: "Время сеанса истекло. Войдите в систему повторно" },
        });
      }
    } else {
      history.push("/enter");
    }
  }, [history]);

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { socket, rooms, dispatch } = useContext(ChatContext);
  const [search, setSearch] = useState("");
  const [roomList, setRoomList] = useState([]);
  const [clickedRoom, setClickedRoom] = useState(null);
  const [sortDislay, setSortDisplay] = useState(false);

  //загрузка списка чатов и подписка на событие обновления списка чатов сокета при загрузке страницы
  //отписка от события сокета при переходе на другую страницу

  //если пользователь был перенаправлен на страницу из-за возникшей ошибки,
  //отобразить ошибку
  useEffect(() => {
    if (sessionStorage.token & location.state) {
      setError(location.state.error);
      setTimeout(() => {setError("");
      const state = undefined;
          history.replace({ ...location, state });
    }, 5000);
    }
  }, [location, history]);

  //получаем список чатов и добавляем его в локальное состояние и хранилище
  //при закрытии страницы отписываемся от обновлений списка чатов
  useEffect(() => {
    if (sessionStorage.token) {
      axios
        .get("/api/room/")
        .then((res) => {
          setRoomList(res.data.rooms);
          dispatch({ type: "ADD_ROOMS", rooms: res.data.rooms });
        })
        .catch((err) => {
          if (err.status === "expired") {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("username");
            history.push({
              pathname: "/enter",
              state: {
                err: "Время сеанса истекло. Войдите в систему повторно",
              },
            });
          }
        });
      socket.on("rooms-list", (data) => {
        setRoomList(data);
        dispatch({ type: "ADD_ROOMS", rooms: data });
      });

      return () => {
        socket.removeListener("rooms-list");
      };
    }
  }, [dispatch, socket, history]);

  //сброс ошибки неверного пароля при вводе нового пароля

  useEffect(() => {
    setError("");
  }, [password]);

  //поиск по списку чатов

  function searchRoom(name) {
    setRoomList(
      rooms.filter((room) =>
        room.name.toLowerCase().match(name.trim().toLowerCase())
      )
    );
  }

  //проверка типа чата
  //если чат общий, переход на страницу с окном этого чата
  //если чат приватный, вызов всплывающего окна с формой ввода пароля

  function clickRoom(room) {
    if (room.private) {
      setClickedRoom(room);
    } else {
      history.push(`/${room.slug}`);
    }
  }

  //передача пароля от приватного чата на сервер и обработка возможных ошибок

  function enterPrivateRoom(e) {
    if (e.key === "Enter" && password.length >= 1) {
      axios
        .post(`/api/room/${clickedRoom.slug}`, {
          password,
        })
        .then((response) => {
          if (response.data.status === "success") {
            history.push(`/${clickedRoom.slug}`);
            setClickedRoom(null);
          } else if (response.data.status === "failed") {
            setError(response.data.error);
          }
        })
        .catch((err) => {
          if (err.status === "expired") {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("username");
            history.push({
              pathname: "/enter",
              state: {
                err: "Время сеанса истекло. Войдите в систему повторно",
              },
            });
          } else if (err.response.status === 401) setError("Неверный пароль");
          else setError("Сервер не отвечает");
        });
    }
  }

  //сортировка списка чатов по указанному критерию
  //закрытие всплывающего окна с вариантами сортировки

  function sort(type) {
    if (type === "default") setRoomList(rooms);
    else if (type === "private") {
      let privated = [];
      let opened = [];
      rooms.forEach((room) => {
        if (room.private) privated.push(room);
        else opened.push(room);
      });
      setRoomList([...opened, ...privated]);
    } else {
      const quickSort = (array) => {
        if (array.length < 2) {
          return array;
        }
        const chosenIndex = array.length - 1;
        const chosen = array[chosenIndex];
        const a = [];
        const b = [];
        for (let i = 0; i < chosenIndex; i++) {
          const temp = array[i];
          temp[type] > chosen[type] ? a.push(temp) : b.push(temp);
        }

        const output = [...quickSort(a), chosen, ...quickSort(b)];
        return output;
      };

      setRoomList(quickSort(roomList));
    }
    setSortDisplay(false);
  }

  return (
    <div className="container">
      <div className="rooms">
        <section className="search">
          <div className="search__box">
            <input
              type="text"
              name="search"
              id=""
              placeholder="Искать чат"
              onChange={(e) => {
                setSearch(e.target.value);
                searchRoom(e.target.value);
              }}
              value={search}
            />
            {search && (
              <button
                className="search__stop"
                onClick={() => {
                  setSearch("");
                  setRoomList(rooms);
                }}
              >
                X
              </button>
            )}
            <button
              className="search__sort-icon"
              onClick={() => setSortDisplay((state) => !state)}
            >
              <i className="fa fa-sort-amount-up"></i>
            </button>
            {sortDislay && (
              <ul className="search__sort-container">
                <li
                  className="search__sort-item"
                  onClick={() => sort("default")}
                >
                  <span>По умолчанию</span>
                </li>
                <li
                  className="search__sort-item"
                  onClick={() => sort("members")}
                >
                  <span>По количеству участников</span>
                </li>
                <li
                  className="search__sort-item"
                  onClick={() => sort("messages")}
                >
                  <span>По количеству сообщений</span>
                </li>
                <li
                  className="search__sort-item"
                  onClick={() => sort("private")}
                >
                  <span>По типу чата</span>
                </li>
              </ul>
            )}
          </div>
        </section>
        <section className="rooms__list">
          <ul>
            {roomList &&
              roomList.map((room) => (
                <li key={room._id}>
                  <a
                    href={`/${room.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      clickRoom(room);
                    }}
                  >
                    <Room room={room} />
                  </a>
                </li>
              ))}
          </ul>
        </section>
        <section className="rooms__button">
          <Link
            to="/new-room"
            className="form__button form__button--full-width"
          >
            Создать новый чат
          </Link>
        </section>
      </div>

      {error && !clickedRoom && (
        <div className="rooms__error">
          <span>{error}</span>
        </div>
      )}

      {clickedRoom && (
        <div className="pop-up">
          <div className="pop-up__container">
            <span className="form__head">
              Доступ в этот чат защищен паролем
            </span>
            <div className="form__divider"></div>
            <div className="form__input">
              <label htmlFor="password">Пароль для входа в чат</label>
              <PasswordInput
                name="password"
                value={password}
                setValue={setPassword}
                enter={enterPrivateRoom}
              />

              {error && <p className="form__error">{error}</p>}
            </div>
            <button
              className="pop-up__close"
              onClick={() => {
                setClickedRoom(null);
                setPassword("");
              }}
            >
              <span>X</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
