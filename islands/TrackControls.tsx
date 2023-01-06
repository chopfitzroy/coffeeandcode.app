import { playerSignal, playerService } from "../services/playerService.ts";

const TrackControls = () => {
  return (
    <div>
      <p>{playerSignal.value.value}</p>
      <div class="bg-gray-100">
        <div class="h-2 bg-black" style={{ width: `${playerSignal.value.context.progress}%` }}></div>
      </div>
      <button onClick={() => playerService.send('PLAY')}>Play</button>
      <button onClick={() => playerService.send('PAUSE')}>Pause</button>
    </div>
  );
};

export default TrackControls;
