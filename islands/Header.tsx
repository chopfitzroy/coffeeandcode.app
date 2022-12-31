import { useEffect, useState } from "preact/hooks";
import { Record } from "pocketbase";
import { pb } from "../utils/pocketbase.ts";

const signOut = () => {
  pb.authStore.clear();
};

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

  return (
    <div>
      {loggedIn ? (
        <button onClick={signOut}>
          Sign out
        </button>
      ) : (
        <a href="/signup">
          Sign up
        </a>
      )}
    </div>
  );
};

export default Header;
