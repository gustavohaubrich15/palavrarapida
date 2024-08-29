const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const wordsDatabase = require(__dirname +'/utils/wordsDatabase');
const getTwoSyllableWord = require(__dirname +'/utils/getTwoSyllabeWord');
const findWords = require(__dirname +'/utils/findWords');


const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + '/front'));

// Rota para página do admin
app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/front/admin/admin.html');
});

// Rota para página do cliente
app.get('/client', (req, res) => {
    res.sendFile(__dirname + '/front/client/client.html');
});

const startedWords = async () => {
    try {
        words = await wordsDatabase();
    } catch (err) {
        console.error('Erro ao iniciar o servidor:', err);
    }
}

startedWords()

let clients = [];
let words = [];
let configurations = {
    tempo: 7,
    vidas: 2,
    minJogadores: 3,
    jogoAtivo: true
};
let timer = null;
let game = null;

io.on('connection', (socket) => {
    clients.push({ id: socket.id, role: socket.handshake.query.role, name: socket.handshake.query.name});
    totalUsuarios()

    // Recebendo mensagens do admin
    socket.on('admin-configurations', () => {
        const client = clients.find(c => c.id === socket.id);
        if (client && client.role == 'admin') {
            socket.emit('receive-admin-configurations', configurations);
        }
    });

    socket.on('update-admin-configurations', (newConfigurations) => {
        const client = clients.find(c => c.id === socket.id);
        if (client && client.role == 'admin') {
            configurations = newConfigurations;
            socket.broadcast.emit('receive-admin-configurations', configurations);
        }
        startGame()
    });
   
    startGame()
    
    //Recebendo mensagens do cliente
    socket.on('answer-question', (answer) => {
        if(verifyCorrectAnswer(answer, socket.id)){
            const randomWord = getTwoSyllableWord(words);
            answer.game.silaba = randomWord;
            passTurn(answer.game)
            if(configurations.jogoAtivo){
                game = answer.game
                io.emit('next-turn-player-game', answer.game)
            }
        }
    });

    socket.on('answer-live', (answerLive) => {
        io.emit('update-answer-live', answerLive)
    });

    socket.on('disconnect', () => {
        clients = clients.filter(c => c.id !== socket.id);
        totalUsuarios();
    });
});


const verifyCorrectAnswer = (answer, socketId) =>{
    if(answer.game.jogadores[answer.game.turnoIndexJogador].id != socketId) return false;
    return findWords(answer.word,answer.game.silaba, words);
}


const startGame = () =>{
    let allClients = clients.filter(client => client.role != 'admin');
    if(allClients.length < configurations.minJogadores) return;
    if(!configurations.jogoAtivo) return;

    const randomWord = getTwoSyllableWord(words);

    const shuffleArray = (array) => {
        return array.sort(() => Math.random() - 0.5);
    };
    
    const jogadores = allClients.map(client => ({
        id: client.id,
        name: client.name,
        vidas: configurations.vidas,
        ativo: true
    }));
    
    const shuffledJogadores = shuffleArray(jogadores);
    game = {
        silaba: randomWord, 
        jogadores: shuffledJogadores,
        turnoIndexJogador: 0
    }
    io.emit('game-start', game);
    resetBombTimer()
}

const passTurn = (game) => {
    let proxTurnoIndex = (game.turnoIndexJogador + 1) % game.jogadores.length;

    while (game.jogadores[proxTurnoIndex].vidas <= 0) {
        proxTurnoIndex = (proxTurnoIndex + 1) % game.jogadores.length;
    }

    game.turnoIndexJogador = proxTurnoIndex;

    justActivePlayerWithLives = game.jogadores.filter((jogador, index)=>{ return jogador.vidas > 0})
    console.log(`Turno passado para: ${game.jogadores[game.turnoIndexJogador].name}  - Vidas:${game.jogadores[game.turnoIndexJogador].vidas}`);

    if (justActivePlayerWithLives.length == 1) {
        setChampionPlayer(game.jogadores[proxTurnoIndex].name)
        return
    }
    const randomWord = getTwoSyllableWord(words);
    game.silaba = randomWord;
    resetBombTimer()
};

const setChampionPlayer = (playerName) =>{
    io.emit('champion-user', playerName)
        game = null
        if (timer) {
            clearTimeout(timer);
        }
        clients.forEach(client => {
            if (client.role != 'admin') {
                const socketToDisconnect = io.sockets.sockets.get(client.id);
                if (socketToDisconnect) {
                    socketToDisconnect.disconnect(true);
                }
            }
        });
    clients = clients.filter(client => client.role == 'admin');
    configurations.jogoAtivo = false
    io.emit('receive-admin-configurations', configurations);
}

const resetBombTimer = () => {
    if (timer) {
        clearTimeout(timer);
    }

    timer = setTimeout(() => {
        bombExplode();
    }, configurations.tempo * 1000);
};

const bombExplode = ()=>{
    game.jogadores[game.turnoIndexJogador].vidas -= 1;
    passTurn(game);
    if(configurations.jogoAtivo){
        io.emit('next-turn-player-game', game);
    }
}

const totalUsuarios = () =>{
    io.emit('totalUsuarios', clients.filter(client => client.role != 'admin'));
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
