import { useEffect, useState } from "preact/hooks";
import { Record } from "pocketbase";
import { pb } from "../utils/pocketbase.ts";

const Header = () => {
  const [loggedIn, setLoggedIn] = useState(
    pb.authStore.model instanceof Record,
  );

  useEffect(() => {
    const remove = pb.authStore.onChange((_, model) => {
      setLoggedIn(model instanceof Record);
    });
    return remove;
  }, []);

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
