import { pb } from "./pocketbase.ts";
import { getTracks } from "./playerHistory.ts";
import { getVolume } from "./playerPreferences.ts";
import { getTracksFromCache } from "../storage/playerHistory.ts";
import { getVolumeFromCache } from "../storage/playerPreferences.ts";
import { Track } from "../services/playerService.ts";

// @TODO
// - Right now this is just getting the history
// - We need to get the history and all available tracks and merge the two together

const restoreHistory = () => {
  try {
    return getTracks();
  } catch (_) {
    return getTracksFromCache();
  }
};

const restoreTracks = async () => {
  const [history, tracks] = await Promise.all([
    restoreHistory(),
    pb.collection("tracks").getFullList<Track>(50, {
      sort: "-published",
    }),
  ]);

  return tracks.map(track => {
    const match = history.find(item => {
      return item.track === track.id;
    });

    return {
      ...track,
      position: match.position
    }
  })
};

const restoreVolume = () => {
  try {
    return getVolume();
  } catch (_) {
    return getVolumeFromCache();
  }
};

const restorePlayer = async () => {
  const tracks = await restoreTracks();
  const volume = await restoreVolume();

  return {
    tracks,
    volume,
  };
};

export { restorePlayer };
