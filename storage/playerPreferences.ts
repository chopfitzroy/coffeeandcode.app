import localforage from "localforage";

const volumeKey = 'playerVolume';

const setPlayerVolume = async (volume: number) => {
	try {
		await localforage.setItem(volumeKey, volume);
	} catch (err) {
		console.info(`Failed to set volume with vale of "${volume}" aborting`, err);
	}
}

export {
	setPlayerVolume
}
