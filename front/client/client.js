
const buttonsConfirmName = document.querySelectorAll('.confirmName');
const usernameInput = document.querySelector('#usernameInput');
const errorInitialName = document.querySelector('#errorInitialName');
const userName = document.querySelector('#userName');
const formInitial = document.querySelector('.form-initial');
const answerInput = document.querySelector('#answerInput');
const gameArea = document.querySelector('#gameArea');
const gameAreaAnswer = document.querySelector('#gameAreaAnswer');
const playersContainer = document.querySelector('.players');
const bombContainer = document.querySelector('.bomb-container');
const bomb = document.querySelector('.bomb');
const waitNewRound = document.querySelector('.waitNewRound');
const answerInputClass = document.querySelector('.answerInput');
const arrow = document.querySelector('.arrow');
const championshipArea = document.querySelector('.championshipArea');
const champion = document.querySelector('.champion');
const lobby = document.querySelector('#lobby')
const lobbyTitle = document.querySelector('#lobbyTitle')
const lobbyStatusGame = document.querySelector('#lobbyStatusGame')


let socketTotalUsuarios = io({
    query: {
        role: 'admin',
        name: ''
    }
})

let socket;
let game;
let activeGame;

socketTotalUsuarios.on('totalUsuarios', (usuarios, game) => {
    activeGame = game;
    let users = ''
    usuarios.forEach((usuario)=>{
        users += `<div>${usuario.name}</div>`
    })
    lobby.innerHTML = users;
    lobbyTitle.textContent = `Total de jogadores na sala - ${usuarios.length}`
    lobbyStatusGame.textContent = game != null ?  'Jogo está em andamento...' : ''
});


buttonsConfirmName.forEach((button)=>{
    button.addEventListener('click', () => {
        if (!usernameInput.value) {
            errorInitialName.textContent = "Você digitou um nome não válido."
            return;
        } else if (activeGame != null) {
            errorInitialName.textContent = "O jogo está ativo, aguarde para ingressar na próxima rodada."
            return;
        } else {
            errorInitialName.textContent = ""
            userName.textContent = usernameInput.value
            formInitial.style.display = 'none';
            answerInput.disabled = true
            championshipArea.style.display = 'none';
            gameArea.style.display = 'flex';
            waitNewRound.style.display = 'flex';
            bomb.style.display = 'none';
            arrow.style.display = 'none';
            lobby.style.display = 'none';
            lobbyTitle.style.display = 'none';
            socketTotalUsuarios.disconnect()
            socket = io({
                query: {
                    role: 'client',
                    name: usernameInput.value
                }
            });
            socketEvents()
        }
    })
})

const addUserToBombArea = (usuarios, lobby) => {
    const totalUsers = usuarios.length;
    if (totalUsers === 0) return;

    const topPlayers = document.querySelector('.topPlayers');
    const leftPlayers = document.querySelector('.leftPlayers');
    const rightPlayers = document.querySelector('.rightPlayers');
    const bottomPlayers = document.querySelector('.bottomPlayers');

    topPlayers.innerHTML = '';
    leftPlayers.innerHTML = '';
    rightPlayers.innerHTML = '';
    bottomPlayers.innerHTML = '';

    let divisionPlayers = totalUsers > 3 ? 4 : totalUsers;
  
    const topCount = Math.ceil(totalUsers / divisionPlayers);
    const rightCount = topCount + Math.ceil(totalUsers / divisionPlayers);
    const bottomCount = rightCount + Math.floor(totalUsers / divisionPlayers);

    usuarios.forEach((user, index) => {
        const playerElement = document.createElement('div');
        playerElement.className = 'player';
        playerElement.style.width = `80px`;
        playerElement.style.height = `55px`;
        playerElement.innerHTML = ""
        if (lobby) {
            playerElement.innerHTML = `
            <div id="${user.id}" class="name">${user.name}</div>
        `;
        } else {

            let livesHTML = `<div style="display: flex; justify-content: space-between;">`
            for (let i = 0; i < user.vidas; i++) {
                livesHTML += `<div  class="lives ${user.id}lives"></div>`
            }
            livesHTML += '</div>'
            playerElement.innerHTML += livesHTML + `
            <div id="${user.id}name" class="name">${user.name}</div>
            <div id="${user.id}onlineAnswer"></div>
        `;
        }

        if (index < topCount) {
            topPlayers.appendChild(playerElement);
        } else if (index < rightCount) {
            rightPlayers.appendChild(playerElement);
        } else if (index < bottomCount) {
            bottomPlayers.appendChild(playerElement);
        } else {
            leftPlayers.prepend(playerElement);
        }
    });
};



const socketEvents = () => {
    socket.on('totalUsuarios', (usuarios) => {
        addUserToBombArea(usuarios, true)
    });

    socket.on('game-start', (newGame) => {
        waitNewRound.style.display = 'none';
        bomb.style.display = 'flex';
        arrow.style.display = 'flex';
        bomb.innerHTML = newGame.silaba
        answerInput.id = socket.id + 'answerinput';
        game = newGame
        addUserToBombArea(newGame.jogadores, false)
        disableAllPlayersThatNotAnswer(newGame, socket.id)
        arrowDirection(newGame)
    });

    socket.on('next-turn-player-game', (newGame) => {
        updateLives(newGame)
        game = newGame
        bomb.innerHTML = newGame.silaba
        disableAllPlayersThatNotAnswer(newGame, socket.id)
        arrowDirection(newGame)
    });

    socket.on('update-answer-live', (answerLive) => {
        updateAnswerPlayer(answerLive)
    });

    socket.on('champion-user', (name) => {
        gameArea.style.display = 'none';
        championshipArea.style.display = 'flex';
        champion.textContent = `Vencedor : ${name}`;
    });
}

const disableAllPlayersThatNotAnswer = (newGame, idSocket) => {
    const input = document.getElementById(`${idSocket}answerinput`);
    input.disabled = newGame.jogadores[newGame.turnoIndexJogador].id != idSocket
    input.value = ''
    if(!input.disabled){
        input.focus();
    }
}

const arrowDirection = (newGame) =>{
    newGame.jogadores.forEach((jogador, index)=>{
        const player = document.getElementById(`${jogador.id}name`);
        const playerParent = player.parentNode
        playerParent.style.opacity = index == newGame.turnoIndexJogador ? '1': '0.5'

        if (index == newGame.turnoIndexJogador) {

            if (playerParent.closest('.topPlayers')) {
                rotationAngle = 0; 
            } else if (playerParent.closest('.bottomPlayers')) {
                rotationAngle = 180; 
            } else if (playerParent.closest('.leftPlayers')) {
                rotationAngle = 270; 
            } else if (playerParent.closest('.rightPlayers')) {
                rotationAngle = 90; 
            }

            arrow.style.transform = `rotate(${rotationAngle}deg)`;
         }
    })
}

const updateLives = (newGame) =>{
    const loseLiveAudio = document.querySelector('#loseLiveAudio')
    newGame.jogadores.forEach((jogador, index)=>{
        const lives = document.getElementsByClassName(`${jogador.id}lives`);
        
        if (lives.length > jogador.vidas) {
            for (let i = lives.length; i > jogador.vidas; i--) {
                const playerParent = lives[i - 1].parentNode 
                lives[i - 1].remove();
                //loseLiveAudio.play()
                if(i == 1){
                    const deathElement = document.createElement('div');
                    deathElement.className = 'death';
                    playerParent.appendChild(deathElement)
                }
            }
        }
    })
}

answerInputClass.addEventListener('keydown', (event) => {
    if (event.keyCode == 13) {
        event.preventDefault();
        socket.emit('answer-question', {
            word: event.target.value,
            game: game
        });
    }
});

answerInputClass.addEventListener('input', (event) => {
    socket.emit('answer-live', {
        typing: event.target.value,
        idSocket: socket.id,
        silaba: game.silaba
    });
});


const updateAnswerPlayer = (answerLive) => {
    const answerInputClass = document.getElementById(`${answerLive.idSocket}onlineAnswer`);
    if (answerInputClass) {
        const silaba = game.silaba;
        const userInput = answerLive.typing;
        const silabaIndex = userInput.indexOf(silaba);

        if (silabaIndex !== -1) {
            const beforeSilaba = userInput.slice(0, silabaIndex);
            const silabaPart = userInput.slice(silabaIndex, silabaIndex + silaba.length);
            const afterSilaba = userInput.slice(silabaIndex + silaba.length);

            answerInputClass.innerHTML = `
                <div style="display: flex;">
                <span style="color: gray;">${beforeSilaba}</span>
                <span style="color: green;">${silabaPart}</span>
                <span style="color: gray;">${afterSilaba}</span>
                </div>
            `;
        } else {
            answerInputClass.style.color = "gray";
            answerInputClass.textContent = userInput;
        }
    }
}