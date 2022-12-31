import { pb } from "../utils/pocketbase.ts";
import { useState } from "preact/hooks";

interface SignupRequest {
  email: string;
  username: string;
  password: string;
  passwordConfirm: string;
}

interface FormElements extends HTMLFormControlsCollection {
  email: HTMLInputElement;
  username: HTMLInputElement;
  password: HTMLInputElement;
  passwordConfirm: HTMLInputElement;
}
interface SignupFormElement extends HTMLFormElement {
  readonly elements: FormElements;
}

const SignupForm = () => {
  const [pageState, setPageState] = useState("idle");

  const signUp = async (data: SignupRequest) => {
    try {
      await pb.collection("users").create(data);
      await pb.collection("users").authWithPassword(
        data.username,
        data.password,
      );
    } catch (err) {
      console.log("Error signing up", err);
      setPageState("error");
    }
  };

  const submitHandler = async (event: Event) => {
    event.preventDefault();

    const target = event.target as SignupFormElement;
    const email = target.elements.email.value;
    const username = target.elements.username.value;
    const password = target.elements.password.value;
    const passwordConfirm = target.elements.passwordConfirm.value;

    await signUp({
      email,
      username,
      password,
      passwordConfirm
    });

    window.location.href = "/";
  }

  return (
    <div>
      <p>
        Already a user? <a href="/login">Login</a>.
      </p>
      {pageState === "error" && <p>There has been an error</p>}
      <form onSubmit={submitHandler}>
        <label for="email">Email address</label>
        <input type="text" id="email" name="email" />
        <label for="username">Username</label>
        <input type="text" id="username" name="username" />
        <label for="password">Password</label>
        <input type="password" id="password" name="password" />
        <label for="passwordConfirm">Confirm password</label>
        <input type="password" id="passwordConfirm" name="passwordConfirm" />
        <button type="submit">Sign up</button>
      </form>
    </div>
  );
};

export default SignupForm;
