import localforage from "localforage";

import { IS_BROWSER } from "$fresh/runtime.ts";

const getTrackPosition = async (id: string) => {
  if (!IS_BROWSER) {
    throw new Error("Running in server environment, aborting cache lookup");
  }

  // Using 'track' prefix just to make cache more readable in dev tools
  const value = await localforage.getItem(`track-${id}`);

  if (typeof value === "string") {
    return parseFloat(value);
  }

  if (typeof value === "number") {
    return value;
  }

  throw new Error(`No value found for "${id}" aborting`);
};

const setTrackPosition = async (id: string, position: number) => {
  try {
    await localforage.setItem(`track-${id}`, position);
  } catch (err) {
    console.info(
      `Error setting "${id}" with value "${position}" aborting`,
      err,
    );
  }
};

export { getTrackPosition, setTrackPosition };
