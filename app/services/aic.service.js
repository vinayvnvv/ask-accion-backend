// var PROFILES = require('./../../json/profiles.json');
const PROFILES = [];
class AICService {
    getProfilesBySkills(skillKey, callback) {
        var peoples = [];
        PROFILES.forEach((ppl) => {
            const skills = ppl._source.skills;
            // console.log('skills', skills);
            Object.keys(skills).map((key, index) => {
                if (!skills[key]) return;
                if (skills[key] instanceof Array) {
                    skills[key].map((skl) => {
                        if (skl.toLowerCase().includes(skillKey.toLowerCase())) peoples.push(ppl);
                    });
                } else if(skills[key].constructor === String) {
                    if(skills[key].toLowerCase().includes(skillKey.toLowerCase())) peoples.push(ppl);
                }

            });
        });

        // console.log('peoples', peoples);
        callback(null, peoples)
    }
}
module.exports = new AICService();