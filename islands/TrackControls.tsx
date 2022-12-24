import { useSignal } from "@preact/signals";
import { Button } from "../components/Button.tsx";

interface CounterProps {
  start: number;
}

const TrackControls = (props: CounterProps) => {
  const count = useSignal(props.start);
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => count.value--}>-1</button>
      <button onClick={() => count.value++}>+1</button>
    </div>
  );
}

export default TrackControls;
