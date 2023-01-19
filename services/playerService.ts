import { Howl, Howler } from "howler";
import { signal } from "@preact/signals";
import { isAfter, parseJSON } from "date-fns";
import { restorePlayer } from "../utils/playerRestore.ts";
import { sendVolume } from "../utils/playerPreferences.ts";
import { sendTrackPosition } from "../utils/playerHistory.ts";
import { setPlayerVolume } from "../storage/playerPreferences.ts";
import { AnyEventObject, assign, createMachine, interpret } from "xstate";
import {
  setTrackPosition,
  setTracksToCache,
} from "../storage/playerHistory.ts";

// @TODO
// - Rename to `History`
export interface Track {
  id: string;
  url: string;
  track: string;
  created: string;
  updated: string;
  position: number;
}

interface PlayerMachineContext {
  id: string;
  url: string;
  player: Howl;
  volume: number;
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
  const { volume = 0.5, history = [] } = context || {};

  // @NOTE
  // - It's infinitely easier if the machine thinks that all fields in the context are required
  // - Casting this value to `PlayerMachineContext` helps to handle the XState type inference
  return {
    volume,
    history,
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

const getTrackById = assign<PlayerMachineContext>(
  (context, event: AnyEventObject) => {
    const track = context.history.find((item) => item.id === event.value.id);

    if (track === undefined) {
      throw new Error(`No track found with ID "${event.value.id}", aborting`);
    }

    return {
      ...context,
      id: track.id,
      url: track.url,
      position: track.position,
    };
  },
);

const getLatestTrack = assign<PlayerMachineContext>(
  (context) => {
    const [latest] = context.history.sort((a, b) => {
      return isAfter(parseJSON(a.updated), parseJSON(b.updated)) ? 1 : -1;
    });

    if (latest === undefined) {
      throw new Error(`Unable to find latest track, aborting`);
    }

    return {
      ...context,
      id: latest.id,
      url: latest.url,
      position: latest.position,
    };
  },
);

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
        (context, event) => context.player.volume(event.value),
        assign({ volume: (_, event) => event.value }),
        (_, event) => setPlayerVolume(event.value),
        (_, event) => sendVolume(event.value),
      ],
    },
    SELECT_TRACK_INFO: {
      target: "playing",
      actions: [
        () => Howler.unload(),
        assign((context) =>createInitialContext(context)),
        getTrackById,
        createPlayerInstance,
      ],
    },
  },
  states: {
    // @NOTE
    // - Unfortunately it's impossible to dynamically get the progress here
    // - This is because we can't read the duration of the audio file on page load
    // - https://github.com/goldfire/howler.js/issues/1154
    // - To get around this we persist the progress as well as the duration
    populating: {
      invoke: {
        src: restorePlayer,
        onDone: {
          target: "paused",
          actions: [
            assign({ volume: (_, event) => event.data.volume }),
            assign({ history: (_, event) => event.data.tracks }),
            getLatestTrack,
            createPlayerInstance,
            (_, event) => setPlayerVolume(event.data.volume),
            (_, event) => setTracksToCache(event.data.tracks),
          ],
        },
        onError: {
          target: "failure",
        },
      },
    },
    failure: {
      type: "final",
      // @TODO
      // - Tell the user to refresh the page
    },
    stopped: {
      // @NOTE
      // - All events that would be caught here are global
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
      exit: [
        // @TODO
        // - Persist track position to the context
        // - Storage is already taken care of
      ],
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
