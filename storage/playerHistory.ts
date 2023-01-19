import localforage from "localforage";

import { IS_BROWSER } from "$fresh/runtime.ts";
import { Track } from "../services/playerService.ts";

const playerHistoryTable = localforage.createInstance({
  name: "playerHistory",
  storeName: "tableTracks",
  description: "Store the player history",
});

const getTracksFromCache = async () => {
  if (!IS_BROWSER) {
    throw new Error("Running in server environment, aborting cache lookup");
  }

  if (!IS_BROWSER) {
    console.info("Cannot use cache in server environment, aborting");
    return;
  }
  const keys = await playerHistoryTable.keys();

  const values = keys.map(async (key) => ({
    track: key,
    position: await playerHistoryTable.getItem(key),
  }));

  return await Promise.all(values);
};

const setTracksToCache = async (tracks: Track[]) => {
  if (!IS_BROWSER) {
    console.info("Cannot use cache in server environment, aborting");
    return;
  }

  const tasks = tracks.map((track) =>
    playerHistoryTable.setItem(track.id, track.position)
  );

  return await Promise.all(tasks);
};

const setTrackPosition = async (id: string, position: number) => {
  if (!IS_BROWSER) {
    console.info("Cannot use cache in server environment, aborting");
    return;
  }

  try {
    await playerHistoryTable.setItem(id, position);
  } catch (err) {
    console.info(
      `Error setting "${id}" with value "${position}" aborting`,
      err,
    );
  }
};

export { getTracksFromCache, setTrackPosition, setTracksToCache };
