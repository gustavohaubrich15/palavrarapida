const findWords = (userWord,syllable, words) => {
    return userWord.includes(syllable) && words.includes(userWord)
 };

 module.exports = findWords;