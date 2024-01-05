const { Rettiwt } = require('rettiwt-api');
const API_KEY = 'YOUR_API_KEY';
const rettiwt = new Rettiwt({ apiKey: API_KEY });

// Function to monitor a Twitter user for new follows
async function monitorNewFollows(userId, checkInterval) {
    let lastCheckedCursor = null;
    let knownFollowingIds = new Set();

    // Function to check for new follows
    const checkForNewFollows = async () => {
        try {
            let { data, meta } = await rettiwt.user.following(userId, 100, lastCheckedCursor);
            data.forEach(user => {
                if (!knownFollowingIds.has(user.id_str)) {
                    console.log("New follow detected:", user.screen_name);
                    // Add logic to notify Discord here
                    knownFollowingIds.add(user.id_str);
                }
            });
            lastCheckedCursor = meta.next_cursor_str;
        } catch (err) {
            console.error(err);
        }
    };

    // Initial population of known follows
    await checkForNewFollows();

    // Periodically check for new follows
    setInterval(checkForNewFollows, checkInterval);
}

// Replace '12345678' with the target user's Twitter ID and set an interval (in milliseconds)
monitorNewFollows('12345678', 60000);  // Check every 60 seconds
