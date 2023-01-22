import { playerService, playerSignal } from "../services/playerService.ts";

const Tracks = () => {
  if (playerSignal.value.value === 'populating') {
    return <div><p>Loading...</p></div>
  }

  if (playerSignal.value.value === 'failed') {
    return <div><p>Something went wrong...</p></div>
  }
  
  return (
    <div>
      {playerSignal.value.context.playables.map((playable) => (
        <button
          onClick={() => playerService.send({
            type: "SELECT_TRACK_INFO",
            value: {
              id: playable.id,
              url: `https://api.coffeeandcode.app/api/files/${playable.collectionId}/${playable.id}/${playable.audio}`,
            },
          })}
        >
          {playable.title}
        </button>
      ))}
    </div>
  );
};

export default Tracks;
