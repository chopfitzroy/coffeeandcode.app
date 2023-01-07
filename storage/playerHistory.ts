import localforage from "localforage";

const getTrackPosition = (id?: string) => {
  if (window === undefined) {
    throw new Error("Running in server environment, aborting cache lookup");
  }
  if (id === undefined) {
    throw new Error('Invalid ID passed to "getTrackPosition" aborting');
  }
  return localforage.get(`track-${id}`);
};

export {
  getTrackPosition
}
