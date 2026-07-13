import { postLeaderboard } from "../src/poll.js";

postLeaderboard()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
