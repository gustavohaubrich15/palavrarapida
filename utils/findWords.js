const findWords = (userWord,syllable, words) => {
    return lower(userWord).includes(syllable) && words.includes(lower(userWord))
 };

 module.exports = findWords;