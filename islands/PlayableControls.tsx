import { playerSignal, playerService, getCurrentPlayable } from "../services/playerService.ts";

const visibleStates = ['paused', 'playing'];

const seekProgress = (event: unknown) => {
  const progress = event.target.value as number;

  playerService.send({
    type: 'SEEK',
    value: {
      progress,
      position: null
    }
  });
}

const updateVolume = (event: unknown) => {
  const value = event.target.value as number;
  const volume = value / 100;
  playerService.send({
    type: 'VOLUME_SET',
    value: volume
  });
}

const TrackControls = () => {
  if (!visibleStates.includes(playerSignal.value.value as string)) {
    return <div></div>;
  }
  
  const volume = playerSignal.value.context.volume * 100;
  const current = getCurrentPlayable(playerSignal.value.context);

  return (
    <div>
      <p>{playerSignal.value.value}</p>
      <input type="range" name="playback" min="0" max="100" value={current.progress} onInput={seekProgress} />
      <button onClick={() => playerService.send('PLAY')}>Play</button>
      <button onClick={() => playerService.send('PAUSE')}>Pause</button>
      <input type="range" name="volume" min="0" max="100" value={volume} onInput={updateVolume} />
    </div>
  );
};

export default TrackControls;
