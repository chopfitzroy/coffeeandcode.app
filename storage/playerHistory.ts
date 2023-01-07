import localforage from "localforage";

const getTrackPosition = async (id?: string) => {
  if (window === undefined) {
    throw new Error("Running in server environment, aborting cache lookup");
  }
  if (id === undefined) {
    throw new Error('Invalid ID passed to "getTrackPosition" aborting');
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

const setTrackPosition = async (id: string | undefined, position: number) => {
  if (id === undefined) {
    console.info('Invalid ID passed to "setTrackPosition" aborting');
    return;
  }

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
