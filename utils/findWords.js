const findWords = (userWord,syllable, words) => {
    return userWord.toLowerCase().includes(syllable) && words.includes(userWord.toLowerCase())
 };

 module.exports = findWords;