const fs = require('fs').promises; // Importando a versão Promises do módulo fs

const wordsDatabase = async () => {
    try {
        const filePath = 'utils\\words.txt';
        const data = await fs.readFile(filePath, 'utf8');
        
        const words = data.split('\n').map(line => line.trim());
        return words;
    } catch (err) {
        console.error('Erro ao ler o arquivo:', err);
        throw err;
    }
};

module.exports = wordsDatabase;