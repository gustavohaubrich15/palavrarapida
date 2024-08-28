const socket = io({
    query: {
        role: 'admin'
    }
});

let configurationParam = {
    tempo: 0,
    vidas: 0,
    jogadores: 0,
    jogoAtivo: false
}
const checkboxJogoAtivo = document.querySelector('#jogoAtivo');

window.onload = () => {
    socket.emit('admin-configurations');
}

const updateInputValue = (element, initValue) => {
    const textElement = document.querySelector(`#${element.id}`);
    textElement.textContent = element.value
    if (initValue) {
        textElement.textContent = initValue
        element.value = initValue
    } else {
        if (element.id === 'tempo') {
            configurationParam.tempo = element.value;
        } else if (element.id === 'vidas') {
            configurationParam.vidas = element.value;
        } else if (element.id === 'jogadores') {
            configurationParam.jogadores = element.value;
        }
        updateAdminConfigurations()
    }

}

const initializeSlidersAndCheckbox = (configurations) => {
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        let configValue = 0;
        if (slider.id === 'tempo') {
            configValue = configurations.tempo;
        } else if (slider.id === 'vidas') {
            configValue = configurations.vidas;
        } else if (slider.id === 'jogadores') {
            configValue = configurations.jogadores;
        }
        updateInputValue(slider, configValue);
    });

    if (checkboxJogoAtivo) {
        checkboxJogoAtivo.checked = configurations.jogoAtivo;
    }
}

checkboxJogoAtivo.addEventListener('change', () => {
    configurationParam.jogoAtivo = checkboxJogoAtivo.checked;
    updateAdminConfigurations()
});

const updateAdminConfigurations = () => {
    socket.emit('update-admin-configurations', configurationParam);
}


socket.on('receive-admin-configurations', (configurations) => {
    initializeSlidersAndCheckbox(configurations)
    configurationParam = configurations
})

socket.on('totalUsuarios', (usuarios) => {
    const totalusuarios = document.querySelector('.totalusuarios');
    if (usuarios) {
        totalusuarios.textContent = `Usuários ativos - ${usuarios.length}`;
    }
});



