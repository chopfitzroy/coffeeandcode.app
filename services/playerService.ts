import { Howl, Howler } from "howler";
import { signal } from "@preact/signals";
import { assign, createMachine, interpret } from "xstate";

interface PlayerMachineContext {
  volume: number;
  position: number;
  progress: number;
  track?: string;
  player?: Howl;
}

const initialState = "hidden";

const createInitialContext = (
  context?: PlayerMachineContext,
): PlayerMachineContext => {
  const { volume = 0.5 } = context || {};

  return {
    volume,
    position: 0,
    progress: 0,
  };
};

const playerMachine = createMachine<PlayerMachineContext>({
  predictableActionArguments: true,
  context: createInitialContext(),
  initial: initialState,
  on: {
    STOP: {
      target: "hidden",
      actions: [
        assign((context) => createInitialContext(context)),
        // Unload any hanging instances
        () => Howler.unload(),
      ],
    },
    ADD_TRACK: {
      target: "playing",
      actions: [
        assign((_, event) => event.value),
        assign({
          player: (context) => {
            return new Howl({
              // @ts-expect-error: track has been set
              src: [context.track],
              html5: true,
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
      on: {
        PLAY: {
          target: "playing",
        },
      },
      entry: [
        // @ts-expect-error: player has been set
        (context) => context.player.pause(),
      ],
    },
    playing: {
      on: {
        PAUSE: {
          target: "paused",
        },
        UPDATE_POSITION: {
          actions: assign({ position: (_, event) => event.value }),
        },
        UPDATE_PROGRESS: {
          actions: assign({ progress: (_, event) => event.value }),
        },
      },
      entry: [
        // @ts-expect-error: player has been set
        (context) => context.player.seek(context.position),
        // @ts-expect-error: player has been set
        (context) => context.player.play(),
      ],
      invoke: {
        src: (context) => (send) => {
          // @NOTE
          // - Done as seperate intervals so we can use different interval times
          const positionInterval = setInterval(() => {
            // @ts-expect-error: player has been set
            const position = context.player.seek();
            send({
              type: "UPDATE_POSITION",
              value: position,
            });
          }, 100);

          const progressInterval = setInterval(() => {
            const value =
              // @ts-expect-error: player has been set
              (context.player.seek() / context.player.duration()) * 100;
            // - https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
            const progress = Math.round(value * 100 + Number.EPSILON) / 100;
            send({
              type: "UPDATE_PROGRESS",
              value: progress,
            });
          }, 100);

          return () => {
            clearInterval(positionInterval);
            clearInterval(progressInterval);
          };
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
