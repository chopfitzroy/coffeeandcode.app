import localforage from "localforage";

const playerPreferencesTable = localforage.createInstance({
    name        : 'playerPreferences',
    storeName   : 'tablePreferences',
    description : 'Store the player preferences'
});

const setPlayerVolume = async (volume: number) => {
	try {
		await playerPreferencesTable.setItem('playerVolume', volume);
	} catch (err) {
		console.info(`Failed to set volume with vale of "${volume}" aborting`, err);
	}
}

export {
	setPlayerVolume
}
