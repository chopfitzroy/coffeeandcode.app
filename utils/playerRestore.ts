import { getTracks } from "./playerHistory.ts";
import { getTracksFromCache } from "../storage/playerHistory.ts";

const restoreTracks = () => {
  try {
    return getTracks();
  } catch (_) {
    return getTracksFromCache();
  }
};

const sortTracks = async () => {
  const tracks = await restoreTracks();
  // @TODO
  // - Get by `updated` stamp
  const [first] = tracks;
  return first;
}

export { sortTracks };
