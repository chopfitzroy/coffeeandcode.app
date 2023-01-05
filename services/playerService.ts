import { signal } from "@preact/signals";
import { interpret, createMachine } from 'xstate';

interface CounterMachineContext {
  player: unknown; // Howler instance
  volume: number;
  progress: number;

}

const initialState = 'idle';
const createInitialContext = (): CounterMachineContext => ({
  player: null,
  volume: 50,
  progress: 0,
});

const counterMachine = createMachine<CounterMachineContext>({
  initial: initialState,
  context: createInitialContext(),
  states: {
    idle: {},
    paused: {},
    playing: {},
    failure: {},
  }
});

const counterSignal = signal(counterMachine.getInitialState(initialState));

const counterService = interpret(counterMachine)
  .onTransition((state) => counterSignal.value = state)
  .start();

export {
  counterSignal,
  counterService
}
