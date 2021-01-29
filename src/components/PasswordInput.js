import { useState } from "react";

//поле для ввода пароля

export default function PasswordInput({ name, value, setValue, enter }) {
  const [eyeIconClass, setEyeIconClass] = useState("fa fa-eye-slash");
  return (
    <>
      <input
        className="form__input-field"
        type={eyeIconClass === "fa fa-eye-slash" ? "password" : "text"}
        name={name}
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyUp={enter}
      />
      <i
        className={eyeIconClass}
        onClick={() =>
          setEyeIconClass((eye) =>
            eye === "fa fa-eye-slash" ? "fa fa-eye" : "fa fa-eye-slash"
          )
        }
      ></i>
    </>
  );
}
