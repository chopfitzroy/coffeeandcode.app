import localforage from "localforage";

import { IS_BROWSER } from "$fresh/runtime.ts";

const playerPreferencesTable = localforage.createInstance({
    name        : 'playerPreferences',
    storeName   : 'tablePreferences',
    description : 'Store the player preferences'
});

const getCachedVolume = () => {
	return playerPreferencesTable.getItem('playerVolume');
}

const cacheVolume = async (volume: number) => {
  if (!IS_BROWSER) {
    console.info("Cannot use cache in server environment, aborting");
    return;
  }

	try {
		await playerPreferencesTable.setItem('playerVolume', volume);
	} catch (err) {
		console.info(`Failed to set volume with vale of "${volume}" aborting`, err);
	}
}

export {
	getCachedVolume,
	cacheVolume
}
