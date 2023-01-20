import { trap } from "./trap.ts";
import { pb } from "./pocketbase.ts";
import { fetchTracks } from "./playerHistory.ts";
import { History } from "../services/playerService.ts";
import { getCachedTracks } from "../storage/playerHistory.ts";
import { getCachedVolume } from "../storage/playerPreferences.ts";

const restoreHistory = async () => {
  const [realHistory] = await trap(fetchTracks)();

  if (realHistory !== undefined) {
    return realHistory;
  }

  const [cachedHistory] = await trap(getCachedTracks)();

  return cachedHistory || [];
};

const restoreTracks = async () => {
  const [history, tracks] = await Promise.all([
    restoreHistory(),
    pb.collection("tracks").getFullList<History>(50, {
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
  const [cachedVolume] = await trap(getCachedVolume)();
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
