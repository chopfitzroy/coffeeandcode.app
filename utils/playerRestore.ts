import { getTracks } from "./playerHistory.ts";
import { getTracksFromCache } from "../storage/playerHistory.ts";

const restoreTracks = () => {
  try {
    return getTracks();
  } catch (_) {
    return getTracksFromCache();
  }
};

const restoreVolume = () => {
  // @TODO
  // - Wire this up
  return new Promise (res => res(true));
}

const restorePlayer = async () => {
  const tracks = await restoreTracks();
  const volume = await restoreVolume();

  return {
    tracks,
    volume
  }
}


export { restorePlayer };
