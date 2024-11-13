chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.getLocalStorage) {
        sendResponse(JSON.stringify(localStorage));
    }

    if (message.setLocalStorage) {
        if (message.allLocalStorage) {
            localStorage.clear();
        }

        Object.keys(message.localStorage).forEach(function (key) {
            localStorage[key] = message.localStorage[key];
        });

        sendResponse();
    }

    if (message.getScreen) {
        sendResponse(JSON.stringify({
            width: screen.width,
            height: screen.height
        }));
    }

    if (message.getWindow) {
        sendResponse(JSON.stringify({
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight
        }));
    }

    if (message.editandoNota) {
        sendResponse(editandoNota());
    }

});

function editandoNota() {
    return editandoAlgunaNotaOff() || hayEdicionNuevaNotaPendienteOff();
}

function editandoAlgunaNotaOff() {
    var textoDiv = document.createElement('div');

    for (let i = 0; i < localStorage["totalPost"]; i++) {
        if (((localStorage['tablon' + i] === undefined || localStorage['tablon' + i] === 'undefined') && localStorage['tablonActual'] === '1') ||
            localStorage['tablon' + i] === localStorage['tablonActual']) {
            textoDiv.innerHTML = localStorage['editando'+ i];
            if (localStorage['editando' + i] !== '' && localStorage['editando' + i] !== undefined && localStorage['editando' + i] !== 'undefined' &&
                textoDiv.innerText !== '')
                return i;
        }
    }
    return false;
}

function hayEdicionNuevaNotaPendienteOff() {
    let textoDiv = { innertext: '' };

    if (localStorage['editando']) {
        textoDiv = document.createElement('div');
        textoDiv.innerHTML = localStorage['editando'];
    }

    return localStorage['editando'] !== '' && localStorage['editando'] !== undefined && localStorage['editando'] !== 'undefined' && textoDiv.innerText !== '';
}


