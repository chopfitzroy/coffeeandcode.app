interface HeaderProps {
  loggedIn: boolean;
}

// @TODO
// - Create sign up route
// - Create login route
// - https://github.com/fireship-io/pocketchat-tutorial/blob/main/src/lib/Login.svelte
const Header = ({ loggedIn }: HeaderProps) => {
  if (loggedIn) {
    return (
      <a href="/signout">
        Sign out
      </a>
    );
  }

  return (
    <a href="/signup">
      Sign up
    </a>
  );
};

export default Header;
