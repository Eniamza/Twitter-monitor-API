const usernames = [
    "mrpapawheelie", "paradisio_macho", "QueenBsobo", "leendude", "Defaultplayer13",
    "BraverCrypto", "RvCrypto", "fitforcrypto_", "Rancune_eth", "MineSum10",
    "SonOfATech", "CryptoKaduna", "EmersonDickie", "Mennodeg", "TheEuroSniper",
    "untaochableTT", "tombheads", "CryptoReviewing", "CryptoSGiants", "CryptoYusaku",
    "HanzoYasunaga", "BassManTV", "GempireVC", "ShogunMasterRoy", "SterlingSpecter",
    "AzeroPapi", "themarcojo", "king_caco", "layer1hunter", "BlocksNThoughts",
    "Emperor5500", "ibraxblr", "jkrdoc", "MiyaXBT", "deus_crypto",
    "TheRENInvest", "Teeznutz11", "Cryp__toad"
];

 // Replace with your list of usernames

const { Rettiwt } = require('rettiwt-api');

// Creating a new Rettiwt instance
// Note that for accessing user details, 'guest' authentication can be used
const rettiwt = new Rettiwt();

let idArr = [];

usernames.forEach((username) => {
    rettiwt.user.details(username)
        .then(details => {
            console.log(`${username}-${details.id}`);
            idArr.push(`${username}-${details.id}`);
        })
        .catch(error => {
            console.error(error);
        });
});

console.log("----------------------idArr");
console.log(idArr);
