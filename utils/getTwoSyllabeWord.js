const getTwoSyllableWord = (words) => {
  const min = 2;
  const max = 3;
  const randomInt = Math.floor(Math.random() * (max - min + 1)) + min;
  words = words.filter(word => word.length >= randomInt);
  const randomIndex = Math.floor(Math.random() * words.length);
  word = words[randomIndex]
  const maxStartIndex = word.length - 2;
  const randomStartIndex = Math.floor(Math.random() * (maxStartIndex + 1));
  return word.substring(randomStartIndex, randomStartIndex + 2);
};

module.exports = getTwoSyllableWord;