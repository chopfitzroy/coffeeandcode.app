import { counterSignal, counterService } from "../services/playerService.ts";

const TrackControls = () => {
   return (
    <div>
      <p>{counterSignal.value.context.count}</p>
      <button onClick={() => counterService.send('DEC')}>-1</button>
      <button onClick={() => counterService.send('INC')}>+1</button>
    </div>
  );
}

export default TrackControls;
