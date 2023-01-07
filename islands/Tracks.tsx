import { playerService } from "../services/playerService.ts";

export interface Track {
  id: string;
  title: string;
  audio: string;
  published: string;
  description: string;
  collectionId: string;
}

interface TracksProps {
  tracks: Track[];
}

const Tracks = ({ tracks }: TracksProps) => {
  return (
    <div>
      {tracks.map((track) => (
        <button
          onClick={() => playerService.send({
            type: "SELECT_TRACK_INFO",
            value: {
              id: track.id,
              track: `https://api.coffeeandcode.app/api/files/${track.collectionId}/${track.id}/${track.audio}`,
            },
          })}
        >
          {track.title}
        </button>
      ))}
    </div>
  );
};

export default Tracks;
