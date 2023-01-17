import { playerSignal, playerService } from "../services/playerService.ts";

const updateVolume = (event: unknown) => {
  const value = event.target.value as number;
  const volume = value / 100;
  playerService.send({
    type: 'VOLUME_SET',
    value: volume
  });
}

const TrackControls = () => {
  const volume = playerSignal.value.context.volume * 100;
  return (
    <div>
      <p>{playerSignal.value.value}</p>
      <div class="bg-gray-100">
        <div class="h-2 bg-black" style={{ width: `${playerSignal.value.context.progress}%` }}></div>
      </div>
      <button onClick={() => playerService.send('PLAY')}>Play</button>
      <button onClick={() => playerService.send('PAUSE')}>Pause</button>
      <input type="range" name="volume" min="0" max="100" value={volume}  onChange={updateVolume} />
    </div>
  );
};

export default TrackControls;
