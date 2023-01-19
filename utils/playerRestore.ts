import { trap } from "./trap.ts";
import { pb } from "./pocketbase.ts";
import { getTracks } from "./playerHistory.ts";
import { getVolume } from "./playerPreferences.ts";
import { getTracksFromCache } from "../storage/playerHistory.ts";
import { getVolumeFromCache } from "../storage/playerPreferences.ts";
import { Track } from "../services/playerService.ts";

const restoreHistory = async () => {
  const [realHistory] = await trap(getTracks)();

  if (realHistory !== undefined) {
    return realHistory;
  }

  const [cachedHistory] = await trap(getTracksFromCache)();

  return cachedHistory || [];
};

const restoreTracks = async () => {
  const [history, tracks] = await Promise.all([
    restoreHistory(),
    pb.collection("tracks").getFullList<Track>(50, {
      sort: "-published",
    }),
  ]);

  return tracks.map((track) => {
    const match = history.find((item) => {
      return item.track === track.id;
    });

    const url = `https://api.coffeeandcode.app/api/files/${track.collectionId}/${track.id}/${track.audio}`;
    const position = match ? match.position : 0;
    
    return {
      ...track,
      url,
      position
    };
  });
};

const restoreVolume = async () => {
  const [realVolume] = await trap(getVolume)();

  if (realVolume !== undefined) {
    return realVolume;
  }

  const [cachedVolume] = await trap(getVolumeFromCache)();

  return cachedVolume ?? 0.5;
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
