import { Howl, Howler } from "howler";
import { signal } from "@preact/signals";
import { isAfter, parseJSON } from "date-fns";
import { restorePlayer } from "../utils/playerRestore.ts";
import { persistHistory } from "../utils/playerHistory.ts";
import { cacheVolume } from "../storage/playerPreferences.ts";
import { AnyEventObject, assign, createMachine, interpret } from "xstate";
import {
  cacheAllPositionAndProgress,
  cacheSinglePositionAndProgress,
} from "../storage/playerHistory.ts";

export interface Track {
  id: string;
  title: string;
  audio: string;
  created: string;
  updated: string;
  description: string;
  collectionId: string;
}

export interface History {
  id: string;
  user: string;
  track: string;
  created: string;
  updated: string;
  position: number;
  collectionId: string;
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
  playables: Playable[];
}

const initialState = "populating";
const persistInterval = 5; // In seconds
const contextInterval = 1; // In seconds

const createInitialContext = (
  context?: PlayerMachineContext,
): PlayerMachineContext => {
  const { volume = 0.5, playables = [] } = context || {};

  // @NOTE
  // - It's infinitely easier if the machine thinks that all fields in the context are required
  // - Casting this value to `PlayerMachineContext` helps to handle the XState type inference
  return {
    volume,
    playables,
  } as PlayerMachineContext;
};

const getPositionAndProgress = (context: PlayerMachineContext) => {
  const position = context.player.seek();
  const duration = context.player.duration();
  const value = (position / duration) * 100;
  const progress = Math.round(value * 100 + Number.EPSILON) / 100;

  return {
    position,
    progress,
  };
};

const getCurrentPlayable = (context: PlayerMachineContext) => {
  const playable = context.playables.find((item) => item.id === context.id);

  if (playable === undefined) {
    throw new Error("Invalid ID found in context");
  }

  return playable;
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

const getPlayableById = assign<PlayerMachineContext>(
  {
    id: (context, event: AnyEventObject) => {
      const playable = context.playables.find((item) =>
        item.id === event.value.id
      );

      if (playable === undefined) {
        throw new Error(`No track found with ID "${event.value.id}", aborting`);
      }

      console.log('Playable', playable);

      return playable.id;
    },
  },
);

const getLatestPlayable = assign<PlayerMachineContext>(
  {
    id: (context) => {
      const [playable] = context.playables.sort((a, b) => {
        return isAfter(parseJSON(a.updated), parseJSON(b.updated)) ? 1 : -1;
      });

      if (playable === undefined) {
        throw new Error(`Unable to find latest track, aborting`);
      }

      return playable.id;
    },
  },
);

const updateCurrentPlayable = assign<PlayerMachineContext>({
  playables: (context, event: AnyEventObject) => {
    const current = getCurrentPlayable(context);

    const filtered = context.playables.filter((item) => item.id !== current.id);

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
        getPlayableById,
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
            assign({ playables: (_, event) => event.data.playables }),
            getLatestPlayable,
            (_, event) => cacheVolume(event.data.volume),
            (_, event) => cacheAllPositionAndProgress(event.data.playables),
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
        PERSIST_POSITION_AND_PROGRESS: {
          actions: [
            (_, event) => persistHistory(event.value),
            (_, event) => cacheSinglePositionAndProgress(event.value),
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
      ],
      entry: [
        createPlayerInstance,
        (context) => context.player.seek(getCurrentPlayable(context).position),
        (context) => context.player.play(),
      ],
      invoke: {
        src: (context) => (send) => {
          const contextTimer = setInterval(() => {
            const { position, progress } = getPositionAndProgress(context);

            send({
              type: "UPDATE_CONTEXT",
              value: {
                progress,
                position,
              },
            });
          }, 1000 * contextInterval);

          const persistTimer = setInterval(() => {
            const { position, progress } = getPositionAndProgress(context);
            send({
              type: "PERSIST_POSITION_AND_PROGRESS",
              value: {
                id: context.id,
                progress,
                position,
              },
            });
          }, 1000 * persistInterval);

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

export { getCurrentPlayable, playerService, playerSignal };
