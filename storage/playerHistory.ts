import localforage from "localforage";

import { IS_BROWSER } from "$fresh/runtime.ts";
import { Playable } from "../services/playerService.ts";

const playerHistoryTable = localforage.createInstance({
  name: "playerHistory",
  storeName: "tableTracks",
  description: "Store the player history",
});

const getCachedAllPositionAndProgress = async () => {
  if (!IS_BROWSER) {
    throw new Error("Cannot use cache in server environment, aborting");
  }

  const keys = await playerHistoryTable.keys();

  const values = keys.map(key => playerHistoryTable.getItem(key));

  return await Promise.all(values);
};

const cacheAllPositionAndProgress = async (playables: Playable[]) => {
  if (!IS_BROWSER) {
    console.info("Cannot use cache in server environment, aborting");
    return;
  }

  const tasks = playables.map((playable) =>
    playerHistoryTable.setItem(playable.id, {
      track: playable.id,
      position: playable.position,
      progress: playable.progress
    })
  );

  return await Promise.all(tasks);
};

const cacheSinglePositionAndProgress = async (playable: Playable) => {
  if (!IS_BROWSER) {
    console.info("Cannot use cache in server environment, aborting");
    return;
  }

  try {
    await playerHistoryTable.setItem(playable.id, {
      track: playable.id,
      position: playable.position,
      progress: playable.progress
    });
  } catch (err) {
		console.info(`Failed to cache position and progress, aborting`, err);
  }
};

export { getCachedAllPositionAndProgress, cacheSinglePositionAndProgress, cacheAllPositionAndProgress };
