import { Howl, Howler } from "howler";
import { signal } from "@preact/signals";
import { sendTrackPosition } from "../utils/player.ts";
import { assign, createMachine, interpret } from "xstate";
import { setPlayerVolume } from "../storage/playerPreferences.ts";
import {
  getTrackPosition,
  setTrackPosition,
} from "../storage/playerHistory.ts";

interface PlayerMachineContext {
  id: string;
  track: string;
  player: Howl;
  volume: number;
  position: number;
  progress: number;
}

const initialState = "starting";
const persistInterval = 5; // In seconds
const contextInterval = 0.1; // In seconds

const createInitialContext = (
  context?: PlayerMachineContext,
): PlayerMachineContext => {
  const { volume = 0.5 } = context || {};

  // @NOTE
  // - It's infinitely easier if the machine thinks that all fields in the context are required
  // - Casting this value to `PlayerMachineContext` helps to handle the XState type inference
  return {
    volume,
    position: 0,
    progress: 0,
  } as PlayerMachineContext;
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
    VOLUME_SET: {
      actions: [
        assign({ volume: (_, event) => event.value }),
        (_, event) => setPlayerVolume(event.value),
        // @TODO persist volume to DB
      ],
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
      // @TODO fix this
      // @ts-expect-error: not sure what is causing this
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
        UPDATE_CONTEXT: {
          actions: [
            assign({ progress: (_, event) => event.value.progress }),
            assign({ position: (_, event) => event.value.position }),
          ],
        },
        PERSIST_POSITION: {
          actions: [
            (context, event) => setTrackPosition(context.id, event.value),
            (context, event) => sendTrackPosition(context.id, event.value),
          ],
        },
      },
      entry: [
        (context) => context.player.seek(context.position),
        (context) => context.player.play(),
      ],
      invoke: {
        src: (context) => (send) => {
          const persistTimer = setInterval(() => {
            const position = context.player.seek();
            send({
              type: "PERSIST_POSITION",
              value: position,
            });
          }, 1000 * persistInterval);

          const contextTimer = setInterval(() => {
            const position = context.player.seek();
            const duration = context.player.duration();
            const value = (position / duration) * 100;
            const progress = Math.round(value * 100 + Number.EPSILON) / 100;

            send({
              type: "UPDATE_CONTEXT",
              value: {
                progress,
                position,
              },
            });
          }, 1000 * contextInterval);

          return () => {
            clearInterval(persistTimer);
            clearInterval(contextTimer);
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

// @TODO fix this
// @ts-expect-error: not sure what is causing this
const playerService = interpret(playerMachine)
  // @TODO fix this
  // @ts-expect-error: not sure what is causing this
  .onTransition((state) => playerSignal.value = state)
  .start();

export { playerService, playerSignal };
