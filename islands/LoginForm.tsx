import { pb } from "../utils/pocketbase.ts";
import { useState } from "preact/hooks";

interface LoginRequest {
  username: string;
  password: string;
}

interface FormElements extends HTMLFormControlsCollection {
  username: HTMLInputElement;
  password: HTMLInputElement;
}

interface LoginFormElements extends HTMLFormElement {
  readonly elements: FormElements;
}

const LoginForm = () => {
  const [pageState, setPageState] = useState("idle");

  const login = async ({ username, password }: LoginRequest) => {
    try {
      await pb.collection("users").authWithPassword(
        username,
        password,
      );
    } catch (err) {
      console.log("Error signing up", err);
      setPageState("error");
    }
  };

  const submitHandler = async (event: Event) => {
    event.preventDefault();

    const target = event.target as LoginFormElements;
    const username = target.elements.username.value;
    const password = target.elements.password.value;

    await login({
      username,
      password,
    });

    window.location.href = "/";
  };

  return (
    <form onSubmit={submitHandler}>
      <label for="username">Username</label>
      <input type="text" id="username" name="username" />
      <label for="password">Password</label>
      <input type="password" id="password" name="password" />
      <button type="submit">Login</button>
    </form>
  );
};

export default LoginForm;
