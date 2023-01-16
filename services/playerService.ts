import { Howl, Howler } from "howler";
import { signal } from "@preact/signals";
import { assign, createMachine, interpret, send } from "xstate";
import { restorePlayer } from '../utils/playerRestore.ts';
import { sendVolume } from "../utils/playerPreferences.ts";
import { sendTrackPosition } from "../utils/playerHistory.ts";
import { setPlayerVolume } from "../storage/playerPreferences.ts";
import {
  getTrackPosition,
  setTrackPosition,
} from "../storage/playerHistory.ts";

interface Track {
  id: string;
  url: string;
  position: number;
}

interface PlayerMachineContext {
  id: string;
  url: string;
  player: Howl;
  volume: number;
  // @TODO
  // - Should this just be every track?
  // - With a position of 0 if none defined?
  history: Track[];
  position: number;
  progress: number;
}

const initialState = "populating";
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
      src: [context.url],
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
        (context, event) => context.player.volume(event.value),
        (_, event) => setPlayerVolume(event.value),
        (_, event) => sendVolume(event.value),
      ],
    },
    SELECT_TRACK_INFO: {
      target: "loading",
      actions: [
        () => Howler.unload(),
        assign((context) => createInitialContext(context)),
        assign({ id: (_, event) => event.value.id }),
        assign({ url: (_, event) => event.value.url }),
        // @TODO
        // - Fetch track position from history
        // - Set position
        // - Set progress
      ],
    },
  },
  states: {
    populating: {
      invoke: {
        src: restorePlayer,
        onDone: {
          target: "initializing",
          actions: [
            assign({ volume: (_, event) => event.data.volume }),
            assign({ history: (_, event) => event.data.tracks }),
            (_, event) => setPlayerVolume(event.data.volume)
            // @TODO
            // - Write to cache
          ],
        },
        onError: {
          target: "stopped",
        },
      },
    },
    initializing: {
      // @TODO
      // - Figure out which history track is the most recent
      // - Assign it
      entry: [
        // assign({ id: (_, event) => event.data.id }),
        // assign({ url: (_, event) => event.data.url }),
        // assign({ position: (_, event) => event.data.position }),
        // @TODO
        // - Update progress
        createPlayerInstance,
        send({ type: "INITIALIZED" }),
      ],
      on: {
        INITIALIZED: {
          target: "paused",
        },
      },
    },
    stopped: {
      // @NOTE
      // - All events that would be caught here are global
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
  },
});

const playerSignal = signal(playerMachine.getInitialState(initialState));

const playerService = interpret(playerMachine)
  .onTransition((state) => playerSignal.value = state)
  .start();

export { playerService, playerSignal };
