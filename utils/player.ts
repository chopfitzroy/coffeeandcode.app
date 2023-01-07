import { pb } from "./pocketbase.ts";

// const createTrackPosition = async (id: string, position: number) => {
//   try {
//     const data = {
//           "user": "RELATION_RECORD_ID",
//           "track": id,
//           "progress": 123,
//           "favourite": true
//       };

//     const record = await pb.collection('activities').create(data);
//   } catch (err) {}
// }

// @TODO
// - Rename `activities` to `history`
const writeTrackPosition = async (id: string | undefined, position: number) => {
  if (id === undefined) {
    console.info(`Invalid ID "${id}" passed to "writeTrackPosition" aborting`);
    return
  }
  try {
    // `tack="${id}"`
    const record = await pb.collection('activities').getFirstListItem();
    console.log('Record', record);
  } catch (err) {
    console.info(`Failed to write ID "${id}" with position of "${position}" to server, aborting`, err);
  }
}

export { writeTrackPosition };
