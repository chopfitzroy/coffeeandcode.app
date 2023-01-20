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

const createTrackPosition = async (id: string, position: number) => {
  try {
    const user = pb.authStore.model.id;
    const data = {
      user,
      position,
      track: id,
    };

    const record = await pb.collection("history").create(data);
    return record;
  } catch (err) {
    console.info(
      `Something went wrong when trying to create "${id}" at position "${position}" aborting`,
      err,
    );
  }
};

const persistTrackPosition = async (id: string, position: number) => {
  const loggedIn = pb.authStore.isValid;

  if (loggedIn === false) {
    console.info(`User is not logged in, no way to write to server, aborting`);
    return;
  }

  try {
    const user = pb.authStore.model.id;
    const filter = `user="${user}" && track="${id}"`;

    const { id: existingId, track } = await pb.collection("history")
      .getFirstListItem(filter);

    const record = await pb.collection("history").update(existingId, {
      user,
      track,
      position,
    });

    return record;
  } catch (err) {
    if (err.status !== 404) {
      console.info(
        `Something went wrong when trying to update "${id}" at position "${position}" aborting`,
        err,
      );
      return;
    }

    return createTrackPosition(id, position);
  }
};

export { fetchTracks, persistTrackPosition };
