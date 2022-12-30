import { pb } from "../utils/pocketbase.ts"

const signUp = async (data: SignupRequest) => {
  try {
    await pb.collection("users").create(data);
    await pb.collection("users").authWithPassword(
      data.username,
      data.password,
    );
  } catch (err) {
    console.log("Error signing up", err);
    return new Response(JSON.stringify({ data: err }), {
      status: 500,
    });
  }
};

const SignupForm = () => {
  // @TODO
  // - Handle error feedback
  return (
    <form action="/signup" method="POST">
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
  );
};

export default SignupForm;
