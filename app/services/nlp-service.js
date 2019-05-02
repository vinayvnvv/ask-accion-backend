const WordPOS = require('wordpos'),
    wordpos = new WordPOS();

class NLPClass {
    extarctWordsFromSpeech(str) {
        
        return wordpos.getPOS(str);
    }
    getValidNameFromArray(arr) {
        for(var i=0;i<arr.length;i++) {
            if(arr[i] && arr[i] !== '' && arr[i] !== ' ') return arr[i];
        }
        return false;
    }
}
module.exports = new NLPClass();