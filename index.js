const fs = require('fs');
const { Rettiwt } = require('rettiwt-api');
const { Client, Intents, MessageEmbed } = require('discord.js');
const discordClient = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const dotenv = require('dotenv').config();

const rettiwt = new Rettiwt({ apiKey: process.env.API_KEY });

discordClient.login(process.env.DISCORD_TOKEN);

async function sendDiscordMessage(channelId, user) {
    const channel = discordClient.channels.cache.get(channelId);
    const embed = new MessageEmbed()
        .setColor('#0099ff')
        .setTitle(user.userName)
        .setURL(`https://twitter.com/${user.userName}`)
        .setDescription(user.description)
        .setThumbnail(user.profileImage)
        .addFields(
            { name: 'Favourites Count', value: user.favouritesCount.toString(), inline: true },
            { name: 'Followers Count', value: user.followersCount.toString(), inline: true },
            { name: 'Followings Count', value: user.followingsCount.toString(), inline: true }
        );
    channel.send({ embeds: [embed] });
}

const userChannelMap = {
    '1094180454054260736': '1192169325671497888', // @eniamza
    '1470080142965829633': '1192202439881932942', // @incredox
    '1103404363861684236': '1192807692494979143', // CryptoKaduna
    '1368241204404482049': '1192807762397237358', // QueenBsobo
    '1180483714096259077': '1192807872225103913', // Defaultplayer13
    '1583297561741475840': '1192807927841554432', // paradisio_macho
    '1155762475582787584': '1192807980077428816', // RvCrypto
    '35901992': '1192808047878340748', // mrpapawheelie
    '1458708003620851714': '1192808098876887082', // fitforcrypto_
    '1059475475876245507': '1192808169223753738', // TheEuroSniper
    '1077799561': '1192808220608172144', // SonOfATech
    '1339822687380750336': '1192808285833801738', // CryptoSGiants
    '1428320937749876742': '1192808341290897498', // tombheads
    '1464821991513407491': '1192808384794202133', // BraverCrypto
    '1356743032922546176': '1192808501089677312', // HanzoYasunaga
    '1540822016030285824': '1192808545830318131', // CryptoReviewing
    '1403735781043212292': '1192808598309449738', // Rancune_eth
    '1049943819557511169': '1192808683617406987', // untaochableTT
    '1641727071612284929': '1192808736226562088', // themarcojo
    '1441455248145592322': '1192808802135834655', // AzeroPapi
    '1552065495263838208': '1192808887225696276', // MineSum10
    '1384152823223316487': '1192808948621906021', // SterlingSpecter
    '1327923114408349697': '1192808998202777680', // Mennodeg
    '1462134193224306704': '1192809048173707264', // MiyaXBT
    '1355928280105439235': '1192809102158614528', // EmersonDickie
    '47991533': '1192809151462645921', // layer1hunter
    '1515922972317392896': '1192809204675772426', // TheRENInvest
    '321550191': '1192809306647711795', // leendude
    '1966387794': '1192809377061683261', // Cryp__toad
    '1543242999584489472': '1192809424478290000', // CryptoYusaku
    '964130574070898688': '1192809485920649237', // deus_crypto
    '958750409232961536': '1192809537015648307', // BlocksNThoughts
    '785636171669970945': '1192809684864880780', // Emperor5500
    '942793590715142144': '1192809728322060390', // jkrdoc
    '1344343503506178050': '1192809783292612708', // Teeznutz11
    '1630553633375887361': '1192809845468971178', // GempireVC
    '1154414041131081730': '1192809888884207626', // king_caco
    '946739947440103424': '1192809953363247164', // ibraxblr
    '2959257250': '1192810009797595136', // BassManTV
    '941938128201203712': '1192810086821789696' // ShogunMasterRoy
};


async function monitorNewFollowsForMultipleUsers(userIds) {
    let userKnownFollowingIds;
    try {
        const data = fs.readFileSync('knownFollowers.json', 'utf8');
        const entries = JSON.parse(data);
        userKnownFollowingIds = new Map(entries.map(([k, v]) => [k, new Set(v)]));
    } catch (err) {
        console.error('Failed to load known followers from file:', err);
        userKnownFollowingIds = new Map(userIds.map(id => [id, new Set()]));
    }

    let currentIndex = 0;

    const checkForNewFollows = async () => {
        const userId = userIds[currentIndex];
        try {
            let response = await rettiwt.user.following(userId, 50);
            console.log(response.list[0])
            console.log("API CALLED");
            for (let i = 0; i < response.list.length; i++) {
                let user = response.list[i];
                let userSet = userKnownFollowingIds.get(userId);
                if (!userSet) {
                    userSet = new Set();
                    userKnownFollowingIds.set(userId, userSet);
                }
                if (!userSet.has(user.id)) {
                    sendDiscordMessage(userChannelMap[userId], user);
                    userSet.add(user.id);
                } else {
                    break;
                }
            }
        } catch (err) {
            console.error(err);
        }

        try {
            const data = JSON.stringify(Array.from(userKnownFollowingIds.entries()).map(([k, v]) => [k, Array.from(v)]));
            fs.writeFileSync('knownFollowers.json', data);
        } catch (err) {
            console.error('Failed to save known followers to file:', err);
        }

        currentIndex = (currentIndex + 1) % userIds.length;
        setTimeout(checkForNewFollows, 60000);
    }

    checkForNewFollows();
}

discordClient.on('ready', () => {
    console.log(`Logged in as ${discordClient.user.tag}!`);
    const userIds = Object.keys(userChannelMap);
    monitorNewFollowsForMultipleUsers(userIds);
});