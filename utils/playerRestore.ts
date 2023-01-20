import { trap } from "./trap.ts";
import { pb } from "./pocketbase.ts";
import { fetchTracks } from "./playerHistory.ts";
import { History, Track } from "../services/playerService.ts";
import { getCachedVolume } from "../storage/playerPreferences.ts";
import { getCachedAllPositionAndProgress } from "../storage/playerHistory.ts";

const restoreHistory = async () => {
  const [realHistory] = await trap(fetchTracks)();

  if (realHistory !== undefined) {
    return realHistory;
  }

  const [cachedHistory] = await trap(getCachedAllPositionAndProgress)();

  return cachedHistory || [];
};

const restorePlayables = async () => {
  const [history, tracks] = await Promise.all([
    restoreHistory(),
    pb.collection("tracks").getFullList<History>(50, {
      sort: "-published",
    }),
  ]);

  return tracks.map((track: Track) => {
    const match = history.find((item: History) => {
      return item.track === track.id;
    });

    const url = `https://api.coffeeandcode.app/api/files/${track.collectionId}/${track.id}/${track.audio}`;
    const position = match === undefined ? 0 : match.position;
    const progress = match === undefined ? 0 : match.progress;

    return {
      ...track,
      url,
      position,
      progress
    };
  });
};

const restoreVolume = async () => {
  const [cachedVolume] = await trap(getCachedVolume)();
  return cachedVolume ?? 0.5;
};

const restorePlayer = async () => {
  const volume = await restoreVolume();
  const playables = await restorePlayables();

  return {
    volume,
    playables
  };
};

export { restorePlayer };
