import { Howl } from "howler";
import { signal } from "@preact/signals";
import { assign, createMachine, interpret } from "xstate";

interface PlayerMachineContext {
  track: string;
  player: Howl;
  volume: number;
  progress: number;
}

type PartialPlayerMachineContext = Partial<PlayerMachineContext>;

const initialState = "empty";

const createInitialContext = (): PartialPlayerMachineContext => ({
  volume: 0.5,
  progress: 0,
});

const counterMachine = createMachine<PartialPlayerMachineContext>({
  context: createInitialContext(),
  initial: initialState,
  states: {
    empty: {
      on: {
        ADD_TRACK: {
          target: "playing",
          actions: [
            assign({ track: (_, event) => event.value }),
          ],
        },
      },
      exit: [
        assign<PlayerMachineContext>({
          player: (context) => {
            return new Howl({ src: [context.track] });
          },
        }),
      ],
    },
    paused: {
      entry: [
        (context: PlayerMachineContext) => context.player.pause(),
      ],
      on: {
        PLAY: {
          target: "playing",
        },
      },
    },
    playing: {
      entry: [
        (context: PlayerMachineContext) => context.player.play(),
      ],
      on: {
        PAUSE: {
          target: "paused",
        },
      },
    },
  },
});

const counterSignal = signal(counterMachine.getInitialState(initialState));

const counterService = interpret(counterMachine)
  .onTransition((state) => counterSignal.value = state)
  .start();

export { counterService, counterSignal };
