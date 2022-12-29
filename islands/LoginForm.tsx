import PocketBase from "https://esm.sh/pocketbase@0.9.0";

const LoginForm = () => {

	return (
		<form>
		  <label for="email">Email address</label>
		  <input type="text" id="email" name="email" />
		  <label for="password">Password</label>
		  <input type="password" id="password" name="password" />
		</form>
	)
}

export default LoginForm;
