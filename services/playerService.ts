import { Howl, Howler } from "howler";
import { signal } from "@preact/signals";
import { assign, createMachine, interpret } from "xstate";

interface PlayerMachineContext {
  volume: number;
  position: number;
  progress: number;
  id?: string;
  track?: string;
  player?: Howl;
}

const initialState = "starting";

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

const createPlayerInstance = assign<PlayerMachineContext>({
  player: (context) => {
    return new Howl({
      src: [context.track],
      html5: true,
      volume: context.volume,
    });
  },
});

const playerMachine = createMachine<PlayerMachineContext>({
  predictableActionArguments: true,
  context: createInitialContext(),
  initial: initialState,
  on: {
    // @TODO
    // - Add volume up event
    // - Add volume down event
    // - Add volume mute event
    STOP: {
      target: "stopped",
      actions: [
        () => Howler.unload(),
        assign((context) => createInitialContext(context)),
      ],
    },
    LOAD_SETTINGS: {
      actions: assign((context, event) => ({
        ...context,
        ...event.value,
      })),
    },
    SELECT_TRACK_INFO: {
      target: "fetching",
      actions: [
        () => Howler.unload(),
        assign((context, event) => ({
          ...context,
          ...event.value,
        })),
      ],
    },
  },
  states: {
    starting: {
      // @TODO
      // - Invoke promise here
      // - Check if user is logged in
      // - If they are fetch their history
      // - Write the history to the cache in the correct format
    },
    fetching: {
      invoke: {
        // @TODO
        // - Check if the track is stored in the cache
        // - If it is pull the position
        src: async () => { throw new Error ('FORCE ERROR') },
        onDone: {
          target: "playing",
          actions: [
            assign({ position: (_, event) => event.data }),
            createPlayerInstance,
          ],
        },
        onError: {
          target: "playing",
          actions: createPlayerInstance,
        },
      },
    },
    paused: {
      on: {
        PLAY: {
          target: "playing",
        },
      },
      entry: [
        (context) => context.player.pause(),
      ],
    },
    playing: {
      on: {
        PAUSE: {
          target: "paused",
        },
        UPDATE_POSITION: {
          // @TODO
          // - Write to cache
          // - Send to API
          actions: assign({ position: (_, event) => event.value }),
        },
        UPDATE_PROGRESS: {
          // @TODO
          // - Write to cache
          // - Send to API
          actions: assign({ progress: (_, event) => event.value }),
        },
      },
      entry: [
        (context) => context.player.seek(context.position),
        (context) => context.player.play(),
      ],
      invoke: {
        src: (context) => (send) => {
          // @NOTE
          // - Done as seperate intervals so we can use different interval times
          const positionInterval = setInterval(() => {
            const position = context.player.seek();
            send({
              type: "UPDATE_POSITION",
              value: position,
            });
          }, 100);

          const progressInterval = setInterval(() => {
            const value =
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
    stopped: {
      // @NOTE
      // - All events that would be caught here are global
    },
  },
});

const playerSignal = signal(playerMachine.getInitialState(initialState));

const playerService = interpret(playerMachine)
  .onTransition((state) => playerSignal.value = state)
  .start();

export { playerService, playerSignal };
