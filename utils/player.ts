import { pb } from "./pocketbase.ts";

const createTrackPosition = async (id: string, position: number) => {
  try {
    const user = pb.authStore.model.id;
    const data = {
      user: user,
      track: id,
      position,
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

const sendTrackPosition = async (id: string | undefined, position: number) => {
  const loggedIn = pb.authStore.isValid;

  if (loggedIn === false) {
    console.info(`User is not logged in, no way to write to server, aborting`);
    return;
  }

  if (id === undefined) {
    console.info(`Invalid ID "${id}" passed to "sendTrackPosition" aborting`);
    return;
  }

  try {
    const user = pb.authStore.model.id;
    const filter = `user="${user}" && track="${id}"`;

    const { id: recordId, user: recordUser, track: recordTrack } = await pb.collection("history").getFirstListItem(filter);

    const record = await pb.collection('history').update(recordId, {
      position,
      user: recordUser,
      track: recordTrack
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

export { sendTrackPosition };
