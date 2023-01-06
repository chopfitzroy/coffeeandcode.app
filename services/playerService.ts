import { Howl } from "howler";
import { signal } from "@preact/signals";
import { assign, createMachine, interpret } from "xstate";

type Required<Type, Key extends keyof Type> = Type & {
  [Property in Key]-?: Type[Property];
};

interface Progress {
  id: string;
  progress: number;
}

interface PlayerMachineContext {
  volume: number;
  history: Progress[];
  track?: string;
  player?: Howl;
}

const initialState = "hidden";

// @TODO
// - This can probably be cleaned up slightly
const createInitialContext = (context?: PlayerMachineContext): PlayerMachineContext => ({
  volume: context?.volume ?? 0.5,
  history: context?.history || [],
});

const playerMachine = createMachine<PlayerMachineContext>({
  predictableActionArguments: true,
  context: createInitialContext(),
  initial: initialState,
  on: {
    STOP: {
      target: "hidden",
      actions: assign((context) => createInitialContext(context))
    },
    ADD_TRACK: {
      target: "playing",
      actions: [
        assign({ track: (_, event) => event.value }),
        assign({
          player: (context) => {
            return new Howl({
              // @ts-expect-error: track is set in previous action
              src: [context.track],
              volume: context.volume,
            });
          },
        }),
      ],
    },
    LOAD_SETTINGS: {
      actions: assign((_, event) => event.value),
    },
  },
  states: {
    hidden: {},
    paused: {
      entry: [
        (context: Required<PlayerMachineContext, 'player'>) => context.player.pause(),
      ],
      on: {
        PLAY: {
          target: "playing",
        },
      },
    },
    playing: {
      entry: [
        (context: Required<PlayerMachineContext, 'player'>) => context.player.play(),
      ],
      on: {
        PAUSE: {
          target: "paused",
        },
      },
    },
  },
});

const playerSignal = signal(playerMachine.getInitialState(initialState));

const playerService = interpret(playerMachine)
  .onTransition((state) => playerSignal.value = state)
  .start();

export { playerService, playerSignal };
