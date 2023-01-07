import { Howl, Howler } from "howler";
import { signal } from "@preact/signals";
import { writeTrackPosition } from "../utils/player.ts";
import { assign, createMachine, interpret } from "xstate";
import {
  getTrackPosition,
  setTrackPosition,
} from "../storage/playerHistory.ts";

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
    STOP: {
      target: "stopped",
      actions: [
        () => Howler.unload(),
        assign((context) => createInitialContext(context)),
      ],
    },
    // @TODO
    // - Add volume up event
    // - Add volume down event
    // - Add volume mute event
    VOLUME_SET: {
      actions: assign({ volume: (_, event) => event.value }),
    },
    SELECT_TRACK_INFO: {
      target: "loading",
      actions: [
        () => Howler.unload(),
        assign((context) => createInitialContext(context)),
        assign({ id: (_, event) => event.value.id }),
        assign({ track: (_, event) => event.value.track }),
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
      // - Additionally fetch their player preferences
      // - Write their player preferences to the cache in the correct format
    },
    loading: {
      invoke: {
        src: (context) => getTrackPosition(context.id),
        onDone: {
          target: "playing",
          actions: [
            assign({
              position: (_, event) => event.data,
            }),
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
        WRITE_POSITION: {
          actions: (context, event) => writeTrackPosition(context.id, event.value)
        },
        UPDATE_POSITION: {
          actions: [
            assign({ position: (_, event) => event.value }),
            (context, event) => setTrackPosition(context.id, event.value),
          ],
        },
        UPDATE_PROGRESS: {
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
          const progressInterval = setInterval(() => {
            const value = (context.player.seek() / context.player.duration()) *
              100;
            // - https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
            const progress = Math.round(value * 100 + Number.EPSILON) / 100;
            send({
              type: "UPDATE_PROGRESS",
              value: progress,
            });
          }, 100);

          const writePositionInterval = setInterval(() => {
            const position = context.player.seek();
            send({
              type: "WRITE_POSITION",
              value: position,
            });
          }, 5 * 1000);

          const updatePositionInterval = setInterval(() => {
            const position = context.player.seek();
            send({
              type: "UPDATE_POSITION",
              value: position,
            });
          }, 100);

          return () => {
            clearInterval(progressInterval);
            clearInterval(writePositionInterval);
            clearInterval(updatePositionInterval);
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
