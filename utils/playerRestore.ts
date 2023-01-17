import { getTracks } from "./playerHistory.ts";
import { getVolume } from "./playerPreferences.ts";
import { getTracksFromCache } from "../storage/playerHistory.ts";
import { getVolumeFromCache } from "../storage/playerPreferences.ts";

const restoreTracks = () => {
  try {
    return getTracks();
  } catch (_) {
    return getTracksFromCache();
  }
};

const restoreVolume = () => {
  try {
    return getVolume();
  } catch (_) {
    return getVolumeFromCache();
  }
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
