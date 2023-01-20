import { Howl, Howler } from "howler";
import { signal } from "@preact/signals";
import { isAfter, parseJSON } from "date-fns";
import { restorePlayer } from "../utils/playerRestore.ts";
import { cacheVolume } from "../storage/playerPreferences.ts";
import { persistTrackPosition } from "../utils/playerHistory.ts";
import { AnyEventObject, assign, createMachine, interpret } from "xstate";
import { cacheTrackPosition, cacheTracks } from "../storage/playerHistory.ts";

export interface Track {
  id: string;
  title: string;
  audio: string;
  created: string;
  updated: string;
  description: string;
}

export interface History {
  id: string;
  user: string;
  track: string;
  created: string;
  updated: string;
  position: number;
}

export interface Playable extends Track {
  url: string;
  progress: number;
  position: number;
}

interface PlayerMachineContext {
  id: string;
  player: Howl;
  volume: number;
  playable: Playable[];
}

const initialState = "populating";
const persistInterval = 5; // In seconds
const contextInterval = 0.1; // In seconds

const createInitialContext = (
  context?: PlayerMachineContext,
): PlayerMachineContext => {
  const { volume = 0.5, playable = [] } = context || {};

  // @NOTE
  // - It's infinitely easier if the machine thinks that all fields in the context are required
  // - Casting this value to `PlayerMachineContext` helps to handle the XState type inference
  return {
    volume,
    playable,
  } as PlayerMachineContext;
};

const getCurrentPlayable = (context: PlayerMachineContext) => {
  const found = context.playable.find((item) => item.id === context.id);

  if (found === undefined) {
    throw new Error("Invalid ID found in context");
  }

  return found;
};

const createPlayerInstance = assign<PlayerMachineContext>({
  player: (context) => {
    const playable = getCurrentPlayable(context);
    return new Howl({
      src: [playable.url],
      html5: true,
      volume: context.volume,
    });
  },
});

const getTrackById = assign<PlayerMachineContext>(
  {
    id: (context, event: AnyEventObject) => {
      const track = context.playable.find((item) => item.id === event.value.id);

      if (track === undefined) {
        throw new Error(`No track found with ID "${event.value.id}", aborting`);
      }

      return track.id;
    },
  },
);

const getLatestTrack = assign<PlayerMachineContext>(
  {
    id: (context) => {
      const [latest] = context.playable.sort((a, b) => {
        return isAfter(parseJSON(a.updated), parseJSON(b.updated)) ? 1 : -1;
      });

      if (latest === undefined) {
        throw new Error(`Unable to find latest track, aborting`);
      }

      return latest.id;
    },
  },
);

const updateCurrentPlayable = assign<PlayerMachineContext>({
  playable: (context, event: AnyEventObject) => {
    const current = getCurrentPlayable(context);

    const filtered = context.playable.filter((item) => item.id !== current.id);

    return [
      ...filtered,
      {
        ...current,
        progress: event.value.progress,
        position: event.value.position,
      },
    ];
  },
});

const playerMachine = createMachine<PlayerMachineContext>({
  predictableActionArguments: true,
  context: createInitialContext(),
  initial: initialState,
  on: {
    PLAY: {
      target: "playing",
    },
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
        (_, event) => cacheVolume(event.value),
      ],
    },
    SELECT_TRACK_INFO: {
      target: "playing",
      actions: [
        () => Howler.unload(),
        assign((context) => createInitialContext(context)),
        getTrackById,
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
            assign({ playable: (_, event) => event.data.tracks }),
            getLatestTrack,
            (_, event) => cacheVolume(event.data.volume),
            (_, event) => cacheTracks(event.data.tracks),
          ],
        },
        onError: {
          target: "failed",
        },
      },
    },
    failed: {
      type: "final",
      // @TODO
      // - Tell the user to refresh the page
    },
    stopped: {
      // @NOTE
      // - All events that would be caught here are global
    },
    paused: {
      // @NOTE
      // - All events that would be caught here are global
    },
    playing: {
      on: {
        PAUSE: {
          target: "paused",
        },
        UPDATE_CONTEXT: {
          actions: updateCurrentPlayable,
        },
        PERSIST_POSITION: {
          actions: [
            (context, event) => cacheTrackPosition(context.id, event.value),
            (context, event) => persistTrackPosition(context.id, event.value),
          ],
        },
        VOLUME_SET: {
          actions: [
            assign({ volume: (_, event) => event.value }),
            (context, event) => context.player.volume(event.value),
            (_, event) => cacheVolume(event.value),
          ],
        },
      },
      exit: [
        // @NOTE
        // - Unfortunately this needs to be done here
        // - This is to get around audio context issues on page load
        (context) => context.player.pause(),
        // updateCurrentPlayable,
      ],
      entry: [
        createPlayerInstance,
        (context) => context.player.seek(getCurrentPlayable(context).position),
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

export { playerService, playerSignal, getCurrentPlayable };
