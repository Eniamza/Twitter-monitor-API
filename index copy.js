const fs = require('fs');
const { Rettiwt } = require('rettiwt-api');
require('dotenv').config()

const API_KEY = process.env.TWITTER_KEY

const rettiwt = new Rettiwt({ apiKey: API_KEY });

const twitterids = require('./twitterIDs.json');
console.log(twitterids)

//TELEGRAM CONFIGURATION HERE

const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot(process.env.TELEGRAM_KEY, {polling: true});

let delay = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

let isGroup = function(msg) {
    return msg.chat.type === 'group' || msg.chat.type === 'supergroup';
}

bot.onText(/\/follow( .+)?/, async (msg, match) => {
    if(msg.chat.username !== process.env.ADMIN){
        bot.sendMessage(msg.chat.id, "You are not authorized to use this bot.");
        return;
    }
     
    if (isGroup(msg)) {
      bot.sendMessage(msg.chat.id, "Please DM the bot to follow users.");
      return;
    }

    if(match[1]){
        let username = match[1].trim()
        console.log("'",username,"'")
        bot.sendMessage(msg.chat.id, `Following ${username}...`);

        let twitterid;

        try {
            const details = await rettiwt.user.details(`${username}`);
            if(!details){
                bot.sendMessage(msg.chat.id, "User not found.");
                return;
            }

            twitterid = details.id;
            //Push new id to the json file

            let data = fs.readFileSync('twitterIDs.json');
            let json = JSON.parse(data);

            if(json.includes(twitterid)){
                bot.sendMessage(msg.chat.id, `User ${username} is already being monitored.`);
                return;
            }

            json.push(twitterid);
            fs.writeFileSync('twitterIDs.json', JSON.stringify(json));

            bot.sendMessage(msg.chat.id, `User ${username} is being monitored.`);
        } catch (err) {
            console.error(err);
        }
    }
    else{
        bot.sendMessage(msg.chat.id, "Please provide a username to follow. For example: /follow username");
    }
});

bot.onText(/\/unfollow( .+)?/, async (msg, match) => {

    if(msg.chat.username !== process.env.ADMIN){
        bot.sendMessage(msg.chat.id, "You are not authorized to use this bot.");
        return;
    }
    if (isGroup(msg)) {
        bot.sendMessage(msg.chat.id, "Please DM the bot to follow users.");
        return;
    }

    if(match[1]){
        let username = match[1].trim()
        console.log("'",username,"'")
        bot.sendMessage(msg.chat.id, `Unfollowing ${username}...`);

        let twitterid;

        try {
            const details = await rettiwt.user.details(`${username}`);
            if(!details){
                bot.sendMessage(msg.chat.id, "User not found.");
                return;
            }

            twitterid = details.id;
            //Push new id to the json file

            let data = fs.readFileSync('twitterIDs.json');
            let json = JSON.parse(data);

            if(!json.includes(twitterid)){
                bot.sendMessage(msg.chat.id, `User ${username} is not being monitored.`);
                return;
            }

            json = json.filter(item => item !== twitterid);
            fs.writeFileSync('twitterIDs.json', JSON.stringify(json));

            bot.sendMessage(msg.chat.id, `User ${username} is no longer being monitored.`);
        } catch (err) {
            console.error(err);
        }
    }
});

// Matches "/list" command
bot.onText(/\/list/, async (msg) => {

    if(msg.chat.username !== process.env.ADMIN){
        bot.sendMessage(msg.chat.id, "You are not authorized to use this bot.");
        return;
    }

    if (isGroup(msg)) {
        bot.sendMessage(msg.chat.id, "Please DM the bot to follow users.");
        return;
    }

    try {
        let data = fs.readFileSync('twitterIDs.json');
        let json = JSON.parse(data);
        let message = "Currently monitoring: \n";
        bot.sendMessage(msg.chat.id, "Currently Monitoring:");
        for (let id of json) {
            const details = await rettiwt.user.details(id);
            bot.sendMessage(msg.chat.id, `https://twitter.com/${details.userName}`);
        }
    } catch (err) {
        console.error(err);
    }
});

let total = 0;

const fetchAllFollowers = async (userId, count = 100, nextCursor = null) => {


    let response = await rettiwt.user.following(userId,count, nextCursor);
    let followers = response.list;

    console.log(response.next.value)
    console.log(response.list[1].userName)

    total+=followers.length;

    console.log("Current:",followers.length)
    console.log("Total:",total)

    if (response.next.value.split("|")[0] !== '0') {
        followers = followers.concat((await fetchAllFollowers(userId, count,  response.next.value)));
    }


    return followers;
}

async function monitorNewFollowsForMultipleUsers() {
    let userKnownFollowingIds;
    try {
        const data = fs.readFileSync('knownFollowers.json', 'utf8');
        const entries = JSON.parse(data);
        userKnownFollowingIds = new Map(entries.map(([k, v]) => [k, new Set(v)]));
    } catch (err) {
        console.error('Failed to load known followers from file:', err);
        userKnownFollowingIds = new Map();
    }

    let currentIndex = 0;

    const checkForNewFollows = async () => {
        let userIds;
        try {
            const data = fs.readFileSync('./twitterIDs.json', 'utf8');
            userIds = JSON.parse(data);
        } catch (err) {
            console.error('Failed to load Twitter IDs from file:', err);
            userIds = [];
        }
    
        if (!userKnownFollowingIds.size) {
            userIds.forEach(id => userKnownFollowingIds.set(id, new Set()));
        }

        const userId = userIds[currentIndex];
        try {
            console.log("Checking for:",userId)
            let followers = await fetchAllFollowers(userId);
            console.log("Logged for:",userId)

            for (let i = 0; i < followers.length; i++) {
                let user = followers[i];
                let userSet = userKnownFollowingIds.get(userId);
                if (!userSet) {
                    userSet = new Set();
                    userKnownFollowingIds.set(userId, userSet);
                }
                if (!userSet.has(user.id)) {
                    try {
                        const details = await rettiwt.user.details(userId);
                        if(details) {
                            let username2 = details.userName;
                            await delay(2000);
                            let message = `<b><a href="https://twitter.com/${user.userName}">${user.userName}</a></b> is being followed by <b><a href="https://twitter.com/${username2}">${username2}</a></b>`;
                            bot.sendMessage(process.env.TELEGRAM_GROUP, message, {parse_mode: 'HTML'});
                            console.log(message);
                        }
                    } catch (err) {
                        console.error(err);
                    }
                    userSet.add(user.id);

                    // Save known followers to file immediately after a new follower is detected
                    try {
                        const data = JSON.stringify(Array.from(userKnownFollowingIds.entries()).map(([k, v]) => [k, Array.from(v)]));
                        fs.writeFileSync('knownFollowers.json', data);
                    } catch (err) {
                        console.error('Failed to save known followers to file:', err);
                    }
                } 
            }
        } catch (err) {
            console.error(err);
        }

        currentIndex = (currentIndex + 1) % userIds.length;
        setTimeout(checkForNewFollows, 600000);
    }

    checkForNewFollows();
}

monitorNewFollowsForMultipleUsers();