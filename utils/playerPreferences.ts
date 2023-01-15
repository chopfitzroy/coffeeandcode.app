import { pb } from "./pocketbase.ts";

const createVolume = async (volume: number) => {
  try {
    const user = pb.authStore.model.id;
    const data = {
      user,
      volume
    };

    const record = await pb.collection("preferences").create(data);
    return record;
  } catch (err) {
    console.info(
      `Something went wrong when trying to set volume, aborting`,
      err,
    );
  }
};

const sendVolume = async (volume: number) => {
  const loggedIn = pb.authStore.isValid;

  if (loggedIn === false) {
    console.info(`User is not logged in, no way to write to server, aborting`);
    return;
  }

  try {
    const user = pb.authStore.model.id;
    const filter = `user="${user}"`;

    const { id: existingId } = await pb.collection("preferences").getFirstListItem(filter);

    const record = await pb.collection('preferences').update(existingId, {
      user,
      volume,
    });

    return record;
  } catch (err) {
    if (err.status !== 404) {
      console.info(
        `Something went wrong when trying to update "${id}" with volume "${volume}" aborting`,
        err,
      );
      return;
    }

    return createVolume(volume);
  }
};

export { sendVolume };
