import { Playable } from "../services/playerService.ts";
import { pb } from "./pocketbase.ts";

const fetchTracks = async () => {
  const loggedIn = pb.authStore.isValid;

  if (loggedIn === false) {
    throw new Error("User not logged in, unable to fetch tracks, aborting");
  }

  const user = pb.authStore.model.id;
  const filter = `user="${user}"`;

  const records = await pb.collection("history")
    .getFullList(200, { filter });

  return records;
};

const createHistory = async (playable: Playable) => {
  try {
    const user = pb.authStore.model.id;
    const data = {
      user,
      track: playable.id,
      position: playable.position,
      progress: playable.progress
    };

    const record = await pb.collection("history").create(data);
    return record;
  } catch (err) {
    console.info(
      `Something went wrong when trying to create "${playable.id}", aborting`,
      err,
    );
  }
};

const persistHistory = async (playable: Playable) => {
  const loggedIn = pb.authStore.isValid;

  if (loggedIn === false) {
    console.info(`User is not logged in, no way to write to server, aborting`);
    return;
  }

  try {
    const user = pb.authStore.model.id;
    const filter = `user="${user}" && track="${playable.id}"`;

    const { id: existingId, track } = await pb.collection("history")
      .getFirstListItem(filter);

    const record = await pb.collection("history").update(existingId, {
      user,
      track,
      position: playable.position,
      progress: playable.progress
    });

    return record;
  } catch (err) {
    if (err.status !== 404) {
      console.info(
        `Something went wrong when trying to update "${playable.id}", aborting`,
        err,
      );
      return;
    }

    return createHistory(playable);
  }
};

export { fetchTracks, persistHistory };
