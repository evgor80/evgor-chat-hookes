import { useState, useEffect, useCallback, Fragment } from "react";
import { Link, useLocation, useHistory } from "react-router-dom";
import axios from "axios";
import PasswordInput from "./PasswordInput";

//шаблон формы для регистрации/входа пользователя и создания нового чата

export default function Form() {
  const location = useLocation().pathname;
  let history = useHistory();

  const [nameInput, setNameInput] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [privateRoom, setPrivateRoom] = useState(false);
  const [submitButtonState, setButtonState] = useState(true);
  const [errors, setErrors] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });

  const titles = {
    "/login": "Вход в систему",
    "/sign-up": "Регистрация",
    "/new-room": "Создание нового чата",
  };

  const buttonLabels = {
    "/login": "Войти",
    "/sign-up": "Зарегистрироваться",
    "/new-room": "Создать",
  };

  //шаблон для связи с сервером и обработки возможных ошибок для всех методов компонента

  const connectToServer = useCallback(
    (url, form, resCallback) => {
      axios
        .post(url, form)
        .then((response) => {
          resCallback(response);
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
          } else if (err.response.status === 401)
            setErrors((obj) => ({
              ...obj,
              name: "Неверное имя пользователя или пароль",
            }));
          else
            setErrors((obj) => ({
              ...obj,
              name: "Сервер не отвечает",
            }));
        });
    },
    [history]
  );

  //  проверка поля "имя" формы "на лету" на наличие ошибок и доступности имени пользователя/названия чата

  useEffect(() => {
    if (location !== "/login") {
      if (nameInput.length > 0 && nameInput.length < 5) {
        setErrors((obj) => ({
          ...obj,
          name: "Должно содержать не менее 5 символов",
        }));
      } else if (nameInput.length > 15) {
        setErrors((obj) => ({
          ...obj,
          name: "Должно содержать не более 15 символов",
        }));
      } else if (nameInput.match(/[@#$%^?&*)(+="/|:;\\]/g)) {
        setErrors((obj) => ({
          ...obj,
          name: "Не может содержать специальные символы",
        }));
      } else {
        setErrors((obj) => ({
          ...obj,
          name: "",
        }));
        if (location === "/sign-up" && nameInput.length > 1) {
          checkName(
            "/api/user/name",
            {
              username: nameInput,
            },
            "Имя пользователя уже занято"
          );
        }
        if (location === "/new-room" && nameInput.length > 1) {
          checkName(
            "/api/room/name",
            {
              name: nameInput,
            },
            "Такой чат уже существует"
          );
        }
      }
    }
    function checkName(url, nameObj, error) {
      connectToServer(url, nameObj, (response) => {
        if (response.data.status === "success") {
          setErrors((obj) => ({
            ...obj,
            name: "",
          }));
        } else if (response.data.status === "failed") {
          setErrors((obj) => ({
            ...obj,
            name: error,
          }));
        }
      });
    }
  }, [nameInput, location, connectToServer]);

  //  проверка поля пароля формы

  useEffect(() => {
    if (location !== "/login") {
      if (password.length > 0 && password.length < 8) {
        setErrors((obj) => ({
          ...obj,
          password: "Пароль должен содержать не менее 8 символов",
        }));
      } else {
        setErrors((obj) => ({
          ...obj,
          password: "",
        }));
      }
    }
  }, [password, location]);

  //проверка, что значения полей "пароль" и "подтвердить пароль" совпадают

  useEffect(() => {
    if (confirmPassword.length > 0 && password !== confirmPassword) {
      setErrors((obj) => ({
        ...obj,
        confirmPassword: "Пароли не совпадают",
      }));
    } else {
      setErrors((obj) => ({
        ...obj,
        confirmPassword: "",
      }));
    }
  }, [password, confirmPassword]);

  //кнопка отправки формы активна, только если все поля заполнены без ошибок

  useEffect(() => {
    if (location === "/new-room" && !privateRoom) {
      if (nameInput && !errors.name) {
        setButtonState(false);
      } else {
        setButtonState(true);
      }
    } else if (location === "/login") {
      if (nameInput && password) {
        setButtonState(false);
      } else {
        setButtonState(true);
      }
    } else {
      if (
        nameInput &&
        password &&
        confirmPassword &&
        !errors.name &&
        !errors.password &&
        !errors.confirmPassword
      ) {
        setButtonState(false);
      } else {
        setButtonState(true);
      }
    }
  }, [nameInput, password, confirmPassword, errors, privateRoom, location]);

  //сброс сообщения о неверном имени/пароле на странице логина при вводе нового имени/пароля

  useEffect(() => {
    if (location === "/login")
      setErrors((obj) => ({
        ...obj,
        name: "",
      }));
  }, [location, nameInput, password]);

  //сброс формы при переходе на другую страницу

  useEffect(() => {
    setNameInput("");
    setPassword("");
    setConfirmPassword("");
    setErrors({
      name: "",
      password: "",
      confirmPassword: "",
    });
  }, [location]);

  //отправка формы

  function submit(e) {
    e.preventDefault();

    if (location === "/login") {
      authUser("/api/user/login", {
        username: e.target.name.value,
        password: e.target.password.value,
      });
    }

    if (location === "/sign-up") {
      authUser("/api/user/register", {
        username: e.target.name.value,
        password: e.target.password.value,
      });
    }

    if (location === "/new-room") {
      connectToServer(
        "/api/room/new",
        {
          name: e.target.name.value,
          password: e.target.password ? e.target.password.value : "",
          private: e.target.private.checked,
          slug: slugify(e.target.name.value),
        },
        () => {
          history.push("/");
        }
      );
    }
  }

  //шаблон отправки формы для страниц регистрациии/входа пользователя в систему

  function authUser(url, form) {
    connectToServer(url, form, (response) => {
      sessionStorage.username = response.data.user.username;
      sessionStorage.token = response.data.token;
      history.push("/");
    });
  }

  //создание слага для страницы с окном чата

  function slugify(name) {
    let slug = name.toLowerCase().split(" ").join("-");
    return slug;
  }

  return (
    <div className="form">
      <div className="form__container">
        {location !== "/new-room" && (
          <div className="form__top-buttons">
            <Link
              to="/login"
              className={
                "form__button form__button--half-width " +
                (location === "/login" ? "form__button--disabled" : "")
              }
            >
              Вход
            </Link>

            <Link
              to="/sign-up"
              className={
                "form__button form__button--half-width " +
                (location === "/sign-up" ? "form__button--disabled" : "")
              }
            >
              Регистрация
            </Link>
          </div>
        )}
        <form onSubmit={submit}>
          <h1 className="form__head">{titles[location]}</h1>

          <div className="form__divider"></div>
          <div className="form__input">
            <label htmlFor="name">
              {location === "/new-room" ? "Название чата" : "Ваше имя"}
            </label>
            <input
              className="form__input-field"
              type="text"
              name="name"
              required
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
              }}
            />
            {errors.name && <p className="form__error">{errors.name}</p>}
          </div>

          {location === "/new-room" && (
            <div className="form__toggle">
              <ul>
                <li>Приватный</li>
                <li>
                  <label htmlFor="">
                    <input
                      type="checkbox"
                      name="private"
                      onChange={() => setPrivateRoom((type) => !type)}
                    />
                    <span className="form__slider"></span>
                  </label>
                </li>
                <li>Общий</li>
              </ul>
            </div>
          )}
          {(location !== "/new-room" || privateRoom) && (
            <Fragment>
              <div className="form__input">
                <label htmlFor="password">
                  {location === "/new-room"
                    ? "Пароль для входа в чат"
                    : "Пароль"}
                </label>
                <PasswordInput
                  name="password"
                  value={password}
                  setValue={setPassword}
                />
                {errors.password && (
                  <p className="form__error">{errors.password}</p>
                )}
              </div>
              {location !== "/login" && (
                <div className="form__input">
                  <label htmlFor="confirmPassword">Подтвердите пароль</label>
                  <PasswordInput
                    name="confirmPassword"
                    value={confirmPassword}
                    setValue={setConfirmPassword}
                  />
                  {errors.confirmPassword && (
                    <p className="form__error">{errors.confirmPassword}</p>
                  )}
                </div>
              )}
            </Fragment>
          )}
          <button
            type="submit"
            className="form__button form__button--full-width"
            disabled={submitButtonState}
          >
            {buttonLabels[location]}
          </button>
        </form>
      </div>
    </div>
  );
}
