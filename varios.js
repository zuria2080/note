function HayEspacios(text) {
    return text.indexOf(' ') > -1;
}

function cambiaContador() {
    var numPost = 0;
    if (localStorage["contador"] == undefined || localStorage["contador"] == "undefined") localStorage["contador"] = '1';
    switch (localStorage["contador"]) {
        case '1':

            for (i = 0; i < localStorage["totalPost"]; i++) {
                if (((localStorage["tablon" + i] == undefined || localStorage["tablon" + i] == "undefined") && tablonActual == 1) ||
                    localStorage["tablon" + i] == tablonActual) {
                    numPost++;
                }
            }
            break;
        case '2':
            numPost = localStorage["totalPost"];
            break;
        case '3':
            numPost = 0;
    }
    if (numPost > 0)
        chrome.action.setBadgeText({text: String(numPost)});
    else
        chrome.action.setBadgeText({text: ''});

    // if (localStorage["totalPost"] > 0)
    //     chrome.action.setTitle({title: chrome.i18n.getMessage("extName") + ' (' + localStorage["totalPost"] + ')'});
    // else
    //     chrome.action.setTitle({title: chrome.i18n.getMessage("extName")});

    actualizaNombreTablon(tablonActual);
}

function refrescaNota(numPost) {
    if (esBackground()) {
        return;
    }

    if (esPopup()) {
        $('.selector-varios').remove();
        $('.textoNB').html(localStorage['postit' + numPost]);
    } else {
        var index = $('#postit' + numPost).index();
        $('#postit' + numPost).remove();
        muestraPostit(numPost, index);

        esTablonKanban() && refrescaKanban();
        refreshConnections();
        hightlightCode();
    }
}

function muestraTodasLasNotas() {
    for (var i = localStorage["totalPost"] - 1; i >= 0; i--) {
        muestraPostit(i);
    }

    hazKanbanSortable();
    refreshConnections();
    hightlightCode();
}

function refrescaPantalla(boardChange, fuerzaBorrado, soloSiCambia) {
    if (esBackground() || esPopup()) {
        return;
    }

    quitaZoomNotas();

    if (!boardChange) muestraPaneles2(false, false);

    $('.sharePanel').remove();

    if (fuerzaBorrado) {
        $('.postitNB:not(#postitnuevo)').remove();
    } else {
        // Se borran las notas que seguro ya no existen
        $('.postitNB:not(#postitnuevo)').each(function () {
            var numPost = $(this).attr("data-numpost");
            if (parseInt(numPost) >= parseInt(localStorage["totalPost"])) {
                $(this).remove();
            }
        });
    }

    if (esTablonKanban()) {
        inicializaKanban();
    } else {
        borraKanban();
    }

    for (var i = localStorage["totalPost"] - 1; i >= 0; i--) {
        if (!fuerzaBorrado && localStorage['editando' + i] && boardChange && tinyMCE.get('textAreaEdit' + i)) {
            tinyMCE.get('textAreaEdit' + i).remove();
        }

        if (!localStorage['editando' + i] || boardChange) {
            if (!soloSiCambia || $('#texto' + i).html() != localStorage['postit' + i]) {
                $('#postit' + i).remove();
                muestraPostit(i);
            }
        }
    }

    if (esTabCompartido(tablonActual))
        trataTablonComp();
    else
        inicializaFriendsBot();

    hazKanbanSortable();
    refrescaKanban();
    refrescaOrdenacion();
    deslizaPostVisibles(null, true);

    detectColorContrastBackground().then(() => {
        refreshConnections();
        $('.columna').css('borderColor', defaultColorContrastBackground);
    });

    // if (localStorage['fuente'] != undefined && localStorage['fuente'] != "NaN") cambiaFuente(localStorage['fuente']);
    // else localStorage['fuente'] = 1;

    if (localStorage['fondo' + tablonActual] != undefined && localStorage['fondo' + tablonActual] != "NaN" && !cambioTablon.sliding) cambiaFondoNum(localStorage['fondo' + tablonActual]);
    $('.ajaxloader').remove();

    $('#Postits').imagesLoaded(function () {
        // images have loaded
        cambiaIcono();
    });
    hightlightCode();

    !boardChange && compruebaLimites();
    cambiaIcono();
    cambiaContador();
}

function deslizaPostVisibles(dir, soloCanvas) {
    var altura = ($('.paneles2').innerHeight() > 10 && $('.paneles2').innerHeight()) || $('.botones').innerHeight() || localStorage['previousHeight'];
    if (altura > 10) localStorage['previousHeight'] = altura;
    else altura = localStorage['previousHeight'];

    var margen = 70;
    var margenKanban = esTablonKanban() ? 30 : 0;

    // if (altura > 108) altura = 32;  // En Vivaldi hace cosas raras la altura de este elemento

    if (dir == 'down')
        var despl = '+=' + altura + 'px';
    else
        var despl = '-=' + altura + 'px';

    if (!soloCanvas) {
        $('#canvasDiv').animate({"top": despl});

        if (esTablonKanban()) {
            $('.columna-wrapper').animate({"padding-top": despl}, function () {
                $('.columna').height(window.innerHeight - $('.botones').height() - $('.titulo-kanban').height() - 30);
            });
        } else {
            for (var i = 0; i < localStorage["totalPost"]; i++) {
                if (((localStorage["tablon" + i] == undefined || localStorage["tablon" + i] == "undefined") && tablonActual == 1) ||
                    localStorage["tablon" + i] == tablonActual) {
                    $('#postit' + i).animate({"top": despl});
                }
            }
        }
    } else {
        var topCanvas = parseInt($('.paneles2').innerHeight() + $('.titulo-kanban').height() + margen + margenKanban) + 'px';
        $('#canvasDiv').css('top', topCanvas);
    }

    if (isSmallScreen()) {
        compruebaCanvasPosEnMovil(500);
        compruebaCanvasPosEnMovil(2000);
    }
}

function muestraVotar() {
    if (!isChromeExtension()) {
        return;
    }

    var mens = isEdgeExtension() ? "escribeReviewEdge" : "escribeReview";

    if (localStorage[mens] != "false") {
        sweetAlert({
            type: 'info',
            text: chrome.i18n.getMessage(mens),
            confirmText: chrome.i18n.getMessage('noMostrarMas'),
            cancel: true,
            cancelText: chrome.i18n.getMessage('votar'),
            successCallback: function () {
                localStorage[mens] = "false";
            },
            cancelCallback: function () {
                if (isEdgeExtension()) {
                    window.open('https://microsoftedge.microsoft.com/addons/detail/note-board-sticky-notes/ehnmbncdeiinoaojbfjldmghkhjhlkli', '_newtab');
                } else {
                    window.open('https://chrome.google.com/webstore/detail/note-board/goficmpcgcnombioohjcgdhbaloknabb/reviews', '_newtab');
                }
            }
        });
    }
}

function pidePermiso(mens, fondos) {
    sweetAlert({
        text: chrome.i18n.getMessage(mens),
        successCallback: function () {
            permisoOrigenes(fondos);
        }
    });
}

function permisoOrigenes(imagenes) {
    //chrome.permissions.request({origins: ["http://*/*","https://*/*"]}, function(granted) {
    chrome.permissions.request({origins: ['https://www.noteboardapp.com/']}, function (granted) {

        if (granted) {
            if (imagenes) creaFondo();
            console.log('concedido');
        } else console.log('no concedido');
    });
}

function pidePermisoImagenes(mens, creaNota, numPost) {
    if (localStorage[mens] != "false") {
        sweetAlert({
            text: chrome.i18n.getMessage(mens),
            successCallback: function () {
                permisoOrigenesImagenes(creaNota, numPost);
            }
        });
    }
}

function permisoOrigenesImagenes(creaNota, numPost) {
    chrome.permissions.request({origins: ['https://www.noteboardapp.com/']}, function (granted) {
        if (granted) {
            abreFormularioAnexa(creaNota, numPost);
            console.log('concedido');
        } else console.log('no concedido');
    });
}

function sendMessage(message) {
    chrome.runtime.sendMessage(message);
}

function listenMessage(requestType, callback) {
    chrome.runtime.onMessage.addListener(
        function (request, sender) {
            for (var property in request) {
                if (property == requestType) callback(request, sender);
            }
        });
}

function formateaFecha(fecha) {
    var fechaForm = '';
    var anyo = ('0' + fecha.getFullYear()).slice(-2);
    var mes = ('0' + parseInt(fecha.getMonth() + 1)).slice(-2);
    var dia = ('0' + fecha.getDate()).slice(-2);

    if (idiomaEsp(navigator.language)) {
        fechaForm = dia + '-' + mes + '-' + anyo;
    } else
        fechaForm = mes + '-' + dia + '-' + anyo;

    fechaForm += ' ' + ('0' + fecha.getHours()).slice(-2) + ':' + ('0' + fecha.getMinutes()).slice(-2);
    return fechaForm;
}

function idiomaEsp(idioma) {
    return (navigator.language == 'es' || navigator.language == 'ca' || navigator.language == 'es-419' || navigator.language == 'es-ES')
}

function buscarText(texto) {
    var coinci = new Array();
    var temp = document.createElement('div');

    var num = 0;
    if (texto.indexOf('>') == 0 || texto.indexOf('<') == 0) {
        num = parseInt(texto.substr(1));
    }
    if (num)    //buscando posts de más de num dias
    {
        var mayor = (texto.indexOf('>') == 0);
        for (var i = 0; i < localStorage["totalPost"]; i++) {
            if (localStorage['tablon' + i] != '0') {
                if (mayor && difFechas(localStorage['fecha' + i]) > num) coinci.push(i);
                if (!mayor && difFechas(localStorage['fecha' + i]) < num) coinci.push(i);
            }
        }
    } else {
        for (var i = 0; i < localStorage["totalPost"]; i++) {
            temp.innerHTML = localStorage['postit' + i];
            var postitText = temp.innerText.toLowerCase();
            if (postitText.indexOf(texto.toLowerCase()) > -1) coinci.push(i);
        }
    }
    return coinci;
}

function ponAlFrente(evt, numPost) {
    if (evt.target.className.indexOf('mce_') == -1 &&
        evt.target.className.indexOf('inplace') == -1 &&
        evt.target.className != ('calendar')) {
        var maxIndex = maxZindex();
        $('#postit' + numPost).css('z-index', maxIndex + 1);
    }
}

function ponAlFrentePost(numPost) {
    var maxIndex = maxZindex();
    $('#postit' + numPost).css('z-index', maxIndex + 1);
}

function maxZindex(numPost = '') {
    var maxIndex = 10;

    $('.postitNB:not(#postit' + numPost + ')').each(function (index) {
        var $this = $(this);
        if ($this.attr("id") != 'postitnuevo' && $this.css("z-index") != 'auto' && maxIndex < parseInt($this.css("z-index")))
            maxIndex = parseInt($this.css("z-index"));
    });

    return maxIndex;
}


function colorLuminance(hex, lum) {

    // validate hex string
    hex = String(hex).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    lum = lum || 0;

    // convert to decimal and change luminosity
    var rgb = "#", c, i;
    for (i = 0; i < 3; i++) {
        c = parseInt(hex.substr(i * 2, 2), 16);
        c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
        rgb += ("00" + c).substr(c.length);
    }

    return rgb;
}

function esColorOscuro(hexcolor) {
    return getContrastYIQ(hexcolor) === 'white';
}

function getContrastYIQ(hexcolor) {
    var r = parseInt(hexcolor.substr(0, 2), 16);
    var g = parseInt(hexcolor.substr(2, 2), 16);
    var b = parseInt(hexcolor.substr(4, 2), 16);
    var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    // return (yiq >= 128) ? 'black' : 'white';
    return (yiq >= 65) ? 'black' : 'white';
}

function youtube_parser(url) {
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match && match[7].length == 11) {
        return match[7];
    } else {
        console.log("Url incorrecta");
    }
}

function pausecomp(millis) {
    var date = new Date();
    var curDate = null;
    do {
        curDate = new Date();
    }
    while (curDate - date < millis);
}

function validaURL(url) {
    var regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi;
    return regex.test(url);
}

var imgs = new Array();

function preloadImages(numTablon) {
    numTablon = numTablon || tablonActual;

    for (var i = 0; i < localStorage["totalPost"]; i++) {
        if (esNotaVisibleEnTablon(i, numTablon)) {
            imgs[i] = undefined;
            var temp = document.createElement('DIV');
            temp.innerHTML = localStorage['postit' + i];

            var imagenes = temp.querySelectorAll('img:not(.link-upload-img)');

            if (imagenes.length > 0) {
                imgs[i] = new Image();
                imgs[i].src = imagenes[0].src;
            }

            if (localStorage['postit' + i] && localStorage['postit' + i].indexOf('src="http://www.youtube.com/embed') > -1) {
                var posIni = localStorage['postit' + i].indexOf('src="http://www.youtube.com') + 5;
                var posFin = localStorage['postit' + i].indexOf('"', posIni);
                var youtubeUrl = localStorage['postit' + i].substring(posIni, posFin);
                imgs[i] = new Image();
                imgs[i].src = "http://img.youtube.com/vi/" + youtube_parser(youtubeUrl) + "/0.jpg";
            }
        }
    }
}

function closePaneles(excepcion) {
    if (excepcion != 'paneles') {
        $('.paneles').fadeOut();
        $('#panelBotDiv').css({'box-shadow': '0 0 0px black inset'});
    }

    if (excepcion != 'searchPanel') {
        $(".searchPanel").fadeOut();
        $('#searchBot').css({'box-shadow': '0 0 0px black inset'});
    }
    if (excepcion != 'fondos') {
        $(".fondos").fadeOut();
        $('#cambFondo').css({'box-shadow': '0 0 0px black inset'});
    }

    if (excepcion != 'nicksComp') {
        $(".nicksComp").fadeOut();
        $('#compBot').css({'box-shadow': '0 0 0px black inset'});
    }
    if (excepcion != 'panelFuentes') {
        $(".panelFuentes").fadeOut();
        $('#cambF').css({'box-shadow': '0 0 0px black inset'});
    }
}

function mirarSiCerrar(element) {
    // if ($('.paneles').is(":visible")) {
    // 	if ($(element).closest('.paneles').length == 0) {
    // 		$('.paneles').fadeOut();
    // 		$('#panelBotDiv').css({ 'box-shadow': '0 0 0px black inset' });
    // 	}
    // }
    if ($('.searchPanel').is(":visible") && numPostSearch == -1) {
        if ($(element).closest('.searchPanel').length == 0) {
            $('.searchPanel').fadeOut();
            $('#searchBot').css({'box-shadow': '0 0 0px black inset'});
            $('.searchResult').remove();
            //$('#texto'+numPostSearch).html(localStorage["postit"+numPostSearch]);
        }
    }
    if ($('.fondos').is(":visible")) {
        if ($(element).closest('.fondos').length == 0) {
            $('.fondos').fadeOut();
            $('#cambFondo').css({'box-shadow': '0 0 0px black inset'});
        }
    }
    if ($('.nicksComp').is(":visible")) {
        if ($(element).closest('.nicksComp').length == 0) {
            $('.nicksComp').fadeOut();
            $('#compBot').css({'box-shadow': '0 0 0px black inset'});
        }
    }
    if ($('.panelFuentes').is(":visible")) {
        if ($(element).closest('.panelFuentes').length == 0) {
            $('.panelFuentes').fadeOut();
            $('#cambF').css({'box-shadow': '0 0 0px black inset'});
        }
    }
}

function algunoPublico() {
    for (var i = 1; i <= localStorage["numTablones"]; i++) {
        if (localStorage['publico' + i] == 'true') return true;
    }

    return false;
}

function nombreTablon(numTablon = tablonActual) {
    if (numTablon == -999) return chrome.i18n.getMessage("tablonWeb");
    else {
        if (numTablon == 0) return chrome.i18n.getMessage("papelera");
        else {
            if (localStorage['tab' + numTablon + 'Label'] == undefined || localStorage['tab' + numTablon + 'Label'] == "undefined" ||
                localStorage['tab' + numTablon + 'Label'] == "") {
                localStorage['tab' + numTablon + 'Label'] = chrome.i18n.getMessage("tablon") + numTablon;
            }

            return (localStorage['tab' + numTablon + 'Label']);
        }
    }
}

function ordenTablon(n) {
    if (localStorage['ordenTablon' + n] != undefined && localStorage['ordenTablon' + n] != "undefined")
        return (localStorage['ordenTablon' + n]);
    else
        return (n);
}

jQuery.fn.sortElements = (function () {

    var sort = [].sort;

    return function (comparator, getSortable) {

        getSortable = getSortable || function () {
            return this;
        };

        var placements = this.map(function () {

            var sortElement = getSortable.call(this),
                parentNode = sortElement.parentNode,

                // Since the element itself will change position, we have
                // to have some way of storing it's original position in
                // the DOM. The easiest way is to have a 'flag' node:
                nextSibling = parentNode.insertBefore(
                    document.createTextNode(''),
                    sortElement.nextSibling
                );

            return function () {

                if (parentNode === this) {
                    throw new Error(
                        "You can't sort elements if any one is a descendant of another."
                    );
                }

                // Insert before flag:
                parentNode.insertBefore(this, nextSibling);
                // Remove flag:
                parentNode.removeChild(nextSibling);

            };

        });

        return sort.call(this, comparator).each(function (i) {
            placements[i].call(getSortable.call(this));
        });

    };

})();

function wrapText(container, text) {
    // Construct a regular expression that matches text at the start or end of a string or surrounded by non-word characters.
    // Escape any special regex characters in text.
    //var textRE = new RegExp('(^|\\W)' + text.replace(/[\\^$*+.?[\]{}()|]/, '\\$&') + '($|\\W)', 'm');
    var textRE = new RegExp(text.replace(/[\\^$*+.?[\]{}()|]/, '\\$&'), 'i');
    var nodeText;
    var nodeStack = [];

    // Remove empty text nodes and combine adjacent text nodes.
    container.normalize();

    // Iterate through the container's child elements, looking for text nodes.
    var curNode = container.firstChild;

    while (curNode != null) {
        if (curNode.nodeType == Node.TEXT_NODE) {
            // Get node text in a cross-browser compatible fashion.
            if (typeof curNode.textContent == 'string')
                nodeText = curNode.textContent;
            else
                nodeText = curNode.innerText;

            // Use a regular expression to check if this text node contains the target text.
            var match = textRE.exec(nodeText);
            if (match != null) {
                // Create a document fragment to hold the new nodes.
                var fragment = document.createDocumentFragment();

                // Create a new text node for any preceding text.
                if (match.index > 0)
                    fragment.appendChild(document.createTextNode(match.input.substr(0, match.index)));

                // Create the wrapper span and add the matched text to it.
                var spanNode = document.createElement('span');
                spanNode.className = 'spanNoteBoard';
                spanNode.appendChild(document.createTextNode(match[0]));
                fragment.appendChild(spanNode);

                // Create a new text node for any following text.
                if (match.index + match[0].length < match.input.length)
                    fragment.appendChild(document.createTextNode(match.input.substr(match.index + match[0].length)));

                // Replace the existing text node with the fragment.
                curNode.parentNode.replaceChild(fragment, curNode);

                curNode = spanNode;
            }
        } else if (curNode.nodeType == Node.ELEMENT_NODE && curNode.firstChild != null) {
            nodeStack.push(curNode);
            curNode = curNode.firstChild;
            // Skip the normal node advancement code.
            continue;
        }

        // If there's no more siblings at this level, pop back up the stack until we find one.
        while (curNode != null && curNode.nextSibling == null)
            curNode = nodeStack.pop();

        // If curNode is null, that means we've completed our scan of the DOM tree.
        // If not, we need to advance to the next sibling.
        if (curNode != null)
            curNode = curNode.nextSibling;
    }
}

function isValidDate(d) {
    // return d instanceof Date && !isNaN(d);
    return d && d !== 'undefined';
}

function difFechas(date1, date2, interval) {
    if (!isValidDate(date1) || (date2 && !isValidDate(date2))) {
        return 0;
    }

    try {
        if (date1.indexOf('/')) date1 = date1.replace(/\//g, '-');
        if (date1.indexOf('-') == 1) //D-MM-YYYY
            date1 = '0' + date1;

        if (date1.indexOf('-', 3) == 4) //DD-M-YYYY
            date1 = date1.substr(0, 3) + '0' + date1.substr(3);


        if (date1.indexOf('-') == 2) // DD-MM-YYYY
        {
            var date1Aux = date1;
            if (idiomaEsp(navigator.language)) {
                date1 = date1.substr(6) + '-' + date1.substr(3, 2) + '-' + date1.substr(0, 2);
            } else {
                date1 = date1.substr(6) + '-' + date1.substr(0, 2) + '-' + date1.substr(3, 2);
            }
        }

        interval = interval || 'days';
        var second = 1000, minute = second * 60, hour = minute * 60, day = hour * 24, week = day * 7;

        date1 = new Date(date1);
        if (date2) date2 = new Date(date2);
        else date2 = new Date();
        var timediff = date2 - date1;

        // Si sale NaN volvemos a probar con language al revés por si hay notas de dos idiomas
        if (isNaN(timediff)) {
            if (!idiomaEsp(navigator.language)) {
                date1 = date1Aux.substr(6) + '-' + date1Aux.substr(3, 2) + '-' + date1Aux.substr(0, 2);
            } else {
                date1 = date1Aux.substr(6) + '-' + date1Aux.substr(0, 2) + '-' + date1Aux.substr(3, 2);
            }

            date1 = new Date(date1);
            var timediff = date2 - date1;
        }

        if (isNaN(timediff)) return NaN;

        switch (interval) {
            case "years":
                return date2.getFullYear() - date1.getFullYear();
            case "months":
                return (
                    (date2.getFullYear() * 12 + date2.getMonth())
                    -
                    (date1.getFullYear() * 12 + date1.getMonth())
                );
            case "weeks":
                return Math.floor(timediff / week);
            case "days":
                return Math.floor(timediff / day);
            case "hours":
                return Math.floor(timediff / hour);
            case "minutes":
                return Math.floor(timediff / minute);
            case "seconds":
                return Math.floor(timediff / second);
            default:
                return undefined;
        }
    } catch (e) {
        console.log(e);
        return 0;
    }
}

//mydiff('2013-06-17','2014-06-20','days')


/* --------------------------------------------------------------------------------------*/
/* ------------------------   TRATAMIENTO PINS  -----------------------------------------*/

/* --------------------------------------------------------------------------------------*/

function clickImgSelecEdit(evt) {
    $(this).parent().parent().find('.selectorPins').slideToggle();
    var $subSelector = $(this).parent().parent().find('.subSelectorPins');
    if ($subSelector.length > 0 && $subSelector.is(":visible"))
        $subSelector.slideUp();
}

function clickImgSelec(evt, numPost) {
    if (numPost >= 0) {
        var $postit = $('#postit' + numPost);
        $this = $(evt.target);
    } else {
        var $postit = $('#postitnuevo');
        $this = $(this);
    }

    var imgSelec = $postit.find(".pinImgSelec").index(evt.target);
    var $selector = $this.closest('.selectorPins').parent().find('.subSelectorPins');

    if (imgSelec == 0) $postit.find('.pinImg').remove();

    if (imgSelec == 0 || $this.closest('.selectorPins').parent().find('.tipoPins' + imgSelec).length > 0) {
        $selector.slideUp(function () {
            $(this).remove()
        });
        return;
    }
    $selector.slideUp(function () {
        $(this).remove()
    });

    var html = '<div class="subSelectorPins tipoPins' + imgSelec + '" data-tipopin="' + imgSelec + '" data-postit="' + $postit.attr('id') + '">';
    var numPins = 7;
    for (var i = 1; i <= numPins; i++) {
        html += '<img class="subPinImgSelec" src="appimg/pushpins/pushpin' + imgSelec + i + '.png">';
    }
    html += '</div>';
    $this.closest('.selectorPins').after(html);
    $this.closest('.selectorPins').parent().find('.subSelectorPins').slideDown();
    $('.subPinImgSelec').on('click', subClickImgSelec);

}

function subClickImgSelec(evt) {
    var tipoPin = $(this).closest('.subSelectorPins').data('tipopin');
    var postit = $(this).closest('.subSelectorPins').data('postit');

    var imgSelec = $('#' + postit).find(".subPinImgSelec").index(evt.target) + 1;

    $('#' + postit + ' .pinImg').remove();
    if (imgSelec > 0) {
        $('#' + postit).append('<img class="pinImg" data-pushpin="' + tipoPin + imgSelec + '" src="appimg/pushpins/pushpin' + tipoPin + imgSelec + '.png" />');
    }
    $(this).parent().parent().find('.pinImgSelec:first-child').attr('src', "appimg/pushpins/pushpin" + tipoPin + imgSelec + ".png");
}

function esTablonNotasWeb(tablon = tablonActual) {
    return tablon == -999;
}

/*----------------------------------------------------------------------------*/
/*------------------------- PAPELERA -----------------------------------------*/

/*----------------------------------------------------------------------------*/
function esTablonPapelera(tablon = tablonActual) {
    return tablon == 0;
}

function salSiPapelera() {
    if (esTablonPapelera()) {

        sweetAlert({
            type: 'error',
            text: chrome.i18n.getMessage('salSiPapelera'),
            cancel: false
        });
        return true;
    } else return false;
}

function inicializaPapelera() {

    if (esTablonPapelera()) {
        $('#papelera').css({
            'box-shadow': '0 0 50px black inset',
        });
        $('#botonVaciarPapelera').show();
    } else {
        $('#papelera').css({
            'box-shadow': '0 0 0px black inset',
        });
        $('#botonVaciarPapelera').hide();
    }

    for (var i = 0; i < localStorage["totalPost"]; i++) {
        if (localStorage['tablon' + i] == '0') {
            $('#papelera').find('img').attr('src', 'appimg/papeleraLlena.png');
            return;
        }
    }
    $('#papelera').find('img').attr('src', 'appimg/papelera.png');
    $('#botonVaciarPapelera').hide();
}


function vaciarPapelera(evt, dias) {
    if (!dias) {
        var mens = chrome.i18n.getMessage("confirmarPapelera");
        if (idiomaEsp(navigator.language)) {
            mens = '¿' + mens;
        }

        sweetAlert({
            type: 'question',
            text: mens,
            cancel: true,
            successCallback: vaciarPapeleraConfirmado
        });
    } else vaciarPapeleraConfirmado(dias);
}

function vaciarPapeleraConfirmado(dias) {
    var listaBorrados = new Array();

    var i = 0;
    while (i < localStorage["totalPost"]) {
        if (localStorage['tablon' + i] == '0' && (!dias || difFechas(localStorage['fecha' + i]) > dias)) {
            if (isUserConnected()) listaBorrados.push(localStorage["treeId" + i]);
            borrarConfirmado(i, false, true);
        } else i++;
    }
    if (isUserConnected() && listaBorrados.length > 0) {
        borraListaNotas(listaBorrados);
    }
}

function tirarPostitPapelera(numPost, callback) {
    if (numPost == 'nuevopost') return;

    muestraAyudaSnackbar('tiraPapelera');
    $('#papelera').find('img').attr('src', 'appimg/papeleraLlena.png');
    var $postit = $('#postit' + numPost);
    borrarCalendar(numPost);
    $postit.css('z-index', '998998998');
    $postit.animate({top: "50", left: "50", zoom: "0", opacity: "0.3"}, 800, function () {
        $postit.remove();
        if (callback) callback();
    });

    sendRealTime(numPost, {delete: true})
}

function moverPostitTablon(numPost, tablon, callback) {
    var $postit = $('#postit' + numPost);
    $postit.css('z-index', '998998998');
    if (tablon == -999 && $('#tabPa2' + tablon).length == 0) // no existe la pestaña
    {
        muestraPaneles2();
    }

    if (esTablonCompartido(tablon)) {
        sendRealTime(numPost, {create: true}, tablon);
    }

    if (esTablonCompartido(tablonActual)) {
        sendRealTime(numPost, {delete: true}, tablonActual);
    }

    $postit.animate({
        top: $('#tabPa2' + tablon).offset().top,
        left: $('#tabPa2' + tablon).offset().left,
        opacity: "0.2"
    }, 400, function (kk) {
        $postit.remove();
        if (callback) callback();
        refrescaOrdenacion();
    });
}

function notaEnPapelera(numPost) {
    return (localStorage['tablon' + numPost] == '0')
}

function borrarConfirmado(numPost, elimComp, vaciarPapelera) {
    var origen = localStorage['tablon' + numPost];
    $('.sharePanel').remove();
    if (isUserConnected() && !vaciarPapelera && !esNotaCompartida(numPost)) deleteNoteLogin(numPost);
    if (!isUserConnected() && !esNotaCompartida(numPost)) compruebaBorrarImagen(localStorage['postit' + numPost]);

    $('#postit' + numPost).remove();

    borrarCalendar(numPost);

    // for (i = 0; i < localStorage["totalPost"]; i++) {
    //   if (i != numPost) $('#postit' + i).remove();
    // }
    borraPopupConfirmado(numPost);

    localStorage["totalPost"]--;

    for (i = numPost; i < localStorage["totalPost"]; i++) {
        localStorage['postit' + i] = localStorage['postit' + (i + 1)];

        localStorage['tipoA' + i] = localStorage['tipoA' + (i + 1)];
        localStorage["tablon" + i] = localStorage["tablon" + (i + 1)];
        localStorage['X' + i] = localStorage['X' + (i + 1)];
        localStorage['Y' + i] = localStorage['Y' + (i + 1)];
        localStorage['width' + i] = localStorage['width' + (i + 1)];
        localStorage["height" + i] = localStorage["height" + (i + 1)];
        localStorage["treeId" + i] = localStorage["treeId" + (i + 1)];
        localStorage["fecha" + i] = localStorage["fecha" + (i + 1)];
        localStorage["calendar" + i] = localStorage["calendar" + (i + 1)];
        localStorage["sinMarco" + i] = localStorage["sinMarco" + (i + 1)];

        if (localStorage["updated" + (i + 1)] != undefined) {
            localStorage["updated" + i] = localStorage["updated" + (i + 1)];
            localStorage.removeItem("updated" + (i + 1));
        } else localStorage.removeItem("updated" + i);


        if (localStorage["rotacion" + (i + 1)] != undefined) {
            localStorage["rotacion" + i] = localStorage["rotacion" + (i + 1)];
            localStorage.removeItem("rotacion" + (i + 1));
        } else localStorage.removeItem("rotacion" + i);

        if (localStorage["pushpin" + (i + 1)] != undefined) {
            localStorage["pushpin" + i] = localStorage["pushpin" + (i + 1)];
            localStorage.removeItem("pushpin" + (i + 1));
        } else localStorage.removeItem("pushpin" + i);

        if (localStorage["notaWeb" + (i + 1)] != undefined) {
            localStorage["notaWeb" + i] = localStorage["notaWeb" + (i + 1)];
            localStorage.removeItem("notaWeb" + (i + 1));
        } else localStorage.removeItem("notaWeb" + i);

        if (localStorage["userComp" + (i + 1)] != undefined) {
            localStorage["userComp" + i] = localStorage["userComp" + (i + 1)];
            localStorage["nickComp" + i] = localStorage["nickComp" + (i + 1)];
            localStorage.removeItem("userComp" + (i + 1));
            localStorage.removeItem("nickComp" + (i + 1));
        } else {
            localStorage.removeItem("userComp" + i);
            localStorage.removeItem("nickComp" + i);
        }
        if (localStorage["errorConexion" + (i + 1)] != undefined) {
            localStorage["errorConexion" + i] = localStorage["errorConexion" + (i + 1)];
            localStorage.removeItem("errorConexion" + (i + 1));
        } else localStorage.removeItem("errorConexion" + i);

        if (localStorage["columnaKanban" + (i + 1)] != undefined) {
            localStorage["columnaKanban" + i] = localStorage["columnaKanban" + (i + 1)];
            localStorage.removeItem("columnaKanban" + (i + 1));
        } else localStorage.removeItem("columnaKanban" + i);

        if (localStorage["connections" + (i + 1)] != undefined) {
            localStorage["connections" + i] = localStorage["connections" + (i + 1)];
            localStorage.removeItem("connections" + (i + 1));
        } else localStorage.removeItem("connections" + i);

        if (localStorage["minimizado" + (i + 1)] != undefined) {
            localStorage["minimizado" + i] = localStorage["minimizado" + (i + 1)];
            localStorage.removeItem("minimizado" + (i + 1));
        } else localStorage.removeItem("minimizado" + i);

        if (imgs[(i + 1)] != undefined) {
            imgs[i] = imgs[(i + 1)];
        } else imgs[i] = undefined;
    }

    updateConnectionsBorrado(numPost);

    refrescaPantalla(false, true);
    // if (document.URL.indexOf('background') == -1) {
    //   muestraTodasLasNotas()
    // }

    localStorage.removeItem('postit' + localStorage["totalPost"]);
    localStorage.removeItem("tablon" + localStorage["totalPost"]);
    localStorage.removeItem("tipoA" + localStorage["totalPost"]);
    localStorage.removeItem("X" + localStorage["totalPost"]);
    localStorage.removeItem("Y" + localStorage["totalPost"]);
    localStorage.removeItem("width" + localStorage["totalPost"]);
    localStorage.removeItem("height" + localStorage["totalPost"]);
    localStorage.removeItem("treeId" + localStorage["totalPost"]);
    localStorage.removeItem("fecha" + localStorage["totalPost"]);
    localStorage.removeItem("updated" + localStorage["totalPost"]);
    localStorage.removeItem("calendar" + localStorage["totalPost"]);
    localStorage.removeItem("sinMarco" + localStorage["totalPost"]);

    localStorage.removeItem("userComp" + localStorage["totalPost"]);
    localStorage.removeItem("nickComp" + localStorage["totalPost"]);
    localStorage.removeItem("errorConexion" + localStorage["totalPost"]);
    localStorage.removeItem("rotacion" + localStorage["totalPost"]);
    localStorage.removeItem("pushpin" + localStorage["totalPost"]);
    localStorage.removeItem("notaWeb" + localStorage["totalPost"]);
    localStorage.removeItem("columnaKanban" + localStorage["totalPost"]);
    localStorage.removeItem("connections" + localStorage["totalPost"]);
    // localStorage.removeItem("Xpos" + localStorage["totalPost"]);
    // localStorage.removeItem("Ypos" + localStorage["totalPost"]);

    imgs[localStorage["totalPost"]] = undefined;

    if (origen == '0' && !esBackground()) inicializaPapelera();
    if (typeof (aplicaMasonry) == "function") {
        preloadImages();
        aplicaMasonry();
    }
    cambiaIcono();
    cambiaContador();
}

function compruebaBorrarImagen(postit) {
    if (postit) {
        var posIni = postit.indexOf('https://www.noteboardapp.com/users/');
        if (posIni > -1) {
            borrarImagen(postit.substring(posIni, postit.indexOf('.', posIni + 30) + 4));
        }

        posIni = postit.indexOf('https://noteboardapp.s3.amazonaws.com/users/');
        if (posIni > -1) {
            borrarFicherosAws(postit, true);
        }
    }
}


// NOTAS WEB

function esNotaWeb(numPost) {
    return (localStorage["notaWeb" + numPost] != undefined)
}


function notaPerteneceUrl(numPost, url) {
    if (!localStorage['notaWeb' + numPost]) return false;

    var notaWeb = localStorage['notaWeb' + numPost].split('||');

    if (notaWeb[0].endsWith('/*')) {
        return (getHostFromUrl(notaWeb[0]).replace(/(^\w+:|^)\/\//, '') == getHostFromUrl(url).replace(/(^\w+:|^)\/\//, ''))
    } else {
        // se compara sin tener en cuenta el protocolo
        return (notaWeb[0].replace(/(^\w+:|^)\/\//, '') == url.replace(/(^\w+:|^)\/\//, ''))
    }
}

function urlDeNotaWeb(numPost) {
    if (!localStorage['notaWeb' + numPost]) return '';

    var notaWeb = localStorage['notaWeb' + numPost].split('||');
    return notaWeb[0];
}

function algunaNotaWeb() {
    for (var i = 0; i < localStorage["totalPost"]; i++) {
        if (localStorage["tablon" + i] == "-999") return true;
    }
    return false;
}

function getPosicionNotaWeb(numPost) {
    if (!localStorage['notaWeb' + numPost]) return;
    var notaWeb = localStorage['notaWeb' + numPost].split('||');
    return ({x: notaWeb[1], y: notaWeb[2]});
}

function setPosicionNotaWeb(numPost, x, y) {
    if (!localStorage['notaWeb' + numPost]) return;
    var notaWeb = localStorage['notaWeb' + numPost].split('||');
    notaWeb[1] = x;
    notaWeb[2] = y;
    localStorage['notaWeb' + numPost] = notaWeb.join('||');
}

function setUrlNotaWeb(numPost, url) {
    if (!localStorage['notaWeb' + numPost]) return;
    var notaWeb = localStorage['notaWeb' + numPost].split('||');
    notaWeb[0] = url;
    localStorage['notaWeb' + numPost] = notaWeb.join('||');
}

async function modificaNotaWeb(datosNota) {
    var numPost = datosNota.numPost;
    if (datosNota.width) localStorage['width' + numPost] = datosNota.width;
    if (datosNota.height && !tieneNotaAlturaAuto(numPost)) localStorage['height' + numPost] = datosNota.height;
    if (datosNota.left) setPosicionNotaWeb(numPost, datosNota.left, datosNota.top);
    if (datosNota.url) setUrlNotaWeb(numPost, datosNota.url);
    if (isUserConnected()) updateNotaLogin(numPost);
    await setAllLocalStorage();
    sendMessage({mensBack: "muestraNotas"});
}

async function borraNotaWeb(datosNota) {
    var numPost = datosNota.numPost;
    localStorage["tablon" + numPost] = 0;
    var f = new Date();
    if (idiomaEsp(navigator.language))
        localStorage["fecha" + numPost] = f.getDate() + '/' + (f.getMonth() + 1) + '/' + f.getFullYear();
    else
        localStorage["fecha" + numPost] = (f.getMonth() + 1) + '/' + f.getDate() + '/' + f.getFullYear();

    if (isUserConnected()) updateNotaLogin(numPost);
    await setAllLocalStorage();
    sendMessage({mensBack: "muestraNotas"});
}

async function adjuntaHtmlWeb(datosNota) {
    var numPost = datosNota.numPost;
    var html = datosNota.html;

    localStorage["postit" + numPost] += "<br>" + compruebaVideos(html);
    if (localStorage['width' + numPost] == 'auto') localStorage['width' + numPost] = $("#postit" + numPost).width();
    $("#postit" + numPost).remove();

    if (isUserConnected()) {
        updateNotaLogin(numPost);
    }
    if (getCalendarMail(numPost)) crearRegistroMail(numPost);

    await setAllLocalStorage();
    sendMessage({mensBack: "muestraNotas"});
}

function cierraVentana() {
    setTimeout(function () {
        window.close();
    }, 3000);
}

function puntoEnPostit(numPost, x, y) {
    var $postit = $('#postit' + numPost);
    if (!$postit.is(":visible")) return false;

    var postX = parseInt(localStorage['X' + numPost]);
    var postY = parseInt(localStorage['Y' + numPost]);
    var postWidth = $postit.width();
    var postHeight = $postit.height();
    return (postX <= x && x <= postX + postWidth && postY <= y && y <= postY + postHeight);
}

function webkitBrowser() {
    return (navigator.userAgent.toLowerCase().indexOf('webkit') > -1);
}

function elementoEncima(el1, el2) {
    var MINIMUM_HEIGHT = 30; // se considera una altura mínima por cuando se usa con borde superior que tiene altura 0 en notas sin marco

    var el1Height = el1.height() || MINIMUM_HEIGHT;
    var offsetTop = el1.offset().top;
    var offsetLeft = el1.offset().left;
    var offsetBottom = offsetTop + el1Height;
    var offsetRight = offsetLeft + el1.width();
    var offsetTop2 = el2.offset().top;
    var offsetLeft2 = el2.offset().left;
    var offsetBottom2 = offsetTop2 + el2.height();
    var offsetRight2 = offsetLeft2 + el2.width();

    return !((offsetBottom < offsetTop2) ||
        (offsetTop > offsetBottom2) ||
        (offsetRight < offsetLeft2) ||
        (offsetLeft > offsetRight2))
}

function inicializaTema(borraClases) {
    if (borraClases || localStorage["seleccionTema"] == "default") {
        $('body').removeClass('metal piedra marmol lava colorNegro colorGris colorBlanco colorAzul colorVerde');
    }
    if (localStorage["seleccionTema"] && (localStorage["seleccionTema"] != "colorGris" || borraClases) &&
        localStorage["seleccionTema"] != "default") {
        //        $('.top-bar-icons-wrapper,.bottomBar, .paneles, .paneles2').addClass(localStorage["seleccionTema"]);
        $('body').addClass(localStorage["seleccionTema"]);
        $('.paneles2').css({
            'background-position': 'right top'
        });

        if (localStorage["seleccionTema"] == 'colorBlanco') {
            $('.boardsSwitch').css('filter', 'invert(1)');
        }
        ;
    }
}

function ponTooltipPaneles2() {
    $('.tabPaneles2').each(function () {
        var numTablon = $(this).attr('id').substr(6);
        if (numTablon != '+') {
            $(this).tooltipster({
                content: '<div class="contenedor-tablon-tooltip"><div class="borrar-tablon-tooltip" id="borraTabToo' + numTablon + '"><img src="appimg/removeWhite.png"></div><canvas id="canvasTooltip' + numTablon + '" class="canvas-tooltip" width="125" height="100"></canvas></div>',
                contentCloning: false,
                contentAsHTML: true,
                theme: ['tooltipster-noir', 'tooltipster-noir-customized'],
                side: 'bottom',
                delay: 100,
                functionReady: function () {
                    dibujaMaqueta('canvasTooltip' + numTablon, numTablon, 125, 100);
                    $('#canvasTooltip' + numTablon).off().on('click', function () {
                        clickTablon(null, false, numTablon);
                    });
                    $('#borraTabToo' + numTablon).off().on('click', function () {
                        borraTablon(numTablon);
                    });
                    $('.borrar-tablon-tooltip').attr('title', chrome.i18n.getMessage("borraTablon"))
                },
                interactive: true
            });
        }
    });
}

function compruebaNotasWeb() {
    if (!isChromeExtension()) {
        return false;
    }

    var notasWeb = false;
    for (var i = 0; i < localStorage["totalPost"]; i++) {
        if (esNotaWeb(i)) {
            notasWeb = true;
            break;
        }
    }
    if (notasWeb) { // si estamos en el popup miramos si hay permisos aceptados
        if (document.URL.indexOf('popup.html') > 0 || document.URL.indexOf('options.html') > 0) {
            chrome.permissions.contains({
                permissions: ['tabs'],
                origins: ["http://*/*", "https://*/*"]
            }, function (granted) {
                if (!granted) {
                    sweetAlert({
                        text: chrome.i18n.getMessage('notasWebPermisos'),
                        successCallback: function () {
                            chrome.permissions.request({
                                permissions: ['tabs'],
                                origins: ["http://*/*", "https://*/*"]
                            }, function (granted) {
                                if (granted) {
                                    console.log('aceptado');
                                }
                            });
                        },
                        cancel: false,
                        type: 'warning'
                    });
                }
            });
        } else {
            sendMessage({mensBack: "compruebaNotasWeb"});
        }
    }
}


// Determines if the passed element is overflowing its bounds,
// either vertically or horizontally.
// Will temporarily modify the "overflow" style to detect this
// if necessary.
function checkOverflow(el) {
    var curOverflow = el.style.overflow;

    if (!curOverflow || curOverflow === "visible")
        el.style.overflow = "hidden";

    var isOverflowing = el.clientWidth < el.scrollWidth
        || el.clientHeight < el.scrollHeight;

    el.style.overflow = curOverflow;

    return isOverflowing;
}

function postitNoVisibleEntero(numPost) {
    return (checkOverflow(document.getElementById('texto' + numPost)));
}

function compruebaPostitDebajoDeOtros() {
    if (localStorage['masonry' + tablonActual] == 'true' && $('.pinnedNB').length === 0) {
        return;
    }

    $('.postitNB').each(function () {
        var numPost = parseInt($(this).attr('id').substr(6));
        x = parseInt(localStorage['X' + numPost]);
        y = parseInt(localStorage['Y' + numPost]);

        widthPost = $('#postit' + numPost).width();
        heightPost = $('#postit' + numPost).height();

        $('.postitNB').each(function () {
            var numPostTemp = parseInt($(this).attr('id').substr(6));
            if (numPostTemp != numPost) {
                if (puntoEnPostit(numPostTemp, x, y) && puntoEnPostit(numPostTemp, x + widthPost, y) &&
                    puntoEnPostit(numPostTemp, x, y + heightPost) && puntoEnPostit(numPostTemp, x + widthPost, y + heightPost)) {
//                    console.log('postit ' + numPost + ' debajo de postit ' + numPostTemp);
                    var maxIndex = maxZindex();
                    $('#postit' + numPost).css('z-index', maxIndex + 1);
                }
            }
        });
    });
}

function limpiaNombreTablon(texto) {
    return texto.replace(/\\/g, "").replace(/\"/g, "");
}

/* Quita la selección de texto que ocurre al hacer doble click para crear una nota */
function clearSelection() {
    if (document.selection && document.selection.empty) {
        document.selection.empty();
    } else if (window.getSelection) {
        var sel = window.getSelection();
        sel.removeAllRanges();
    }
}

function creaTablonTemporal() {
    $('#postits-temp').remove()

    cambioTablon.sliding = true;

    var $tablonTemp = $('#Postits');
    var $tablonPostits = $('.tablonPostits');

    if (cambioTablon.haciaDerecha) {
        $tablonTemp.after('<div class="Postits" id="Postits" ></div>')
    } else {
        $tablonTemp.before('<div class="Postits" id="Postits" ></div>')
    }

    $tablonTemp.removeAttr('id').addClass('postits-temp').attr('id', 'postits-temp').removeClass('Postits');

    if (cambioTablon.haciaDerecha) {
        $tablonTemp.css('overflow', 'auto');
        $tablonTemp.width(window.innerWidth);
    } else {
        $('#Postits').css('overflow', 'auto');
        $tablonTemp.width(window.innerWidth);
    }

    $('#Postits').width(window.innerWidth);
    $tablonPostits.width($tablonPostits.width() + window.innerWidth);
    $tablonPostits.width($tablonPostits.width() + window.innerWidth + 100);

    $('.postitNB', $tablonTemp).removeAttr('id').removeClass('postitNB');
    if (!cambioTablon.haciaDerecha) {
        $(window).scrollLeft(window.innerWidth); // + 80?? @TODO repasar esta mierda
    }
}

function borraTablonTemporal(tablonSelec) {
    var scroll = cambioTablon.haciaDerecha ? window.innerWidth : 0;
    if (esTablonOrdenado()) {
        ajustaNotasYPadding();
    }

    $('html').animate({scrollLeft: scroll, scrollTop: 0}, 800, function () {
        $('#postits-temp').remove();
        $('.tablonPostits').width($('#Postits').width());
        $('#Postits').css('overflow', 'visible').width(window.innerWidth);
        detectColorContrastBackground().then(() => {
            refreshConnections();
            $('.columna').css('borderColor', defaultColorContrastBackground);
        });

        cambioTablon.sliding = false;
        compruebaLimites();

        window.scrollTo(0, 0);
        cambiaIcono(true);
        compruebaCanvasPosEnMovil(100);
        $('#Postits').css('background-image', '');
        cambiaFondoNum(localStorage['fondo' + tablonSelec]);
    });
}

// Retorna true si el elemento está visible en pantalla (si está visible pero hay que hacer scroll para verlo devuelve false)
function elementInViewport(el) {
    var top = el.offsetTop;
    var left = el.offsetLeft;
    var width = el.offsetWidth;
    var height = el.offsetHeight;

    while (el.offsetParent) {
        el = el.offsetParent;
        top += el.offsetTop;
        left += el.offsetLeft;
    }

    return (
        top >= window.pageYOffset &&
        left >= window.pageXOffset &&
        (top + height) <= (window.pageYOffset + window.innerHeight) &&
        (left + width) <= (window.pageXOffset + window.innerWidth)
    );
}

function compruebaMinimapa() {
    if (hideMinimapa) {
        $('#canvasMaqueta').hide();
        $('#maquetaPant').hide();
    } else {
        $('#canvasMaqueta').show();
        $('#maquetaPant').show();
    }
}

function actualizaNombreTablon(tablon) {
    if (!document.getElementById("nombreTablon")) {
        return;
    }

    tablon = tablon || tablonActual || localStorage['tablonActual'];

    document.getElementById("nombreTablon").innerText = `${nombreTablon(tablon)} - ${cuentaNotas(tablon)}`;
}

function cuentaNotas(tablon) {
    var numPostits = 0;

    for (var i = 0; i < localStorage["totalPost"]; i++) {
        if (esNotaVisibleEnTablon(i, tablon)) {
            numPostits++;
        }
    }

    return numPostits;
}

function checkMaxLocalStorage() {
    try {
        localStorage['pruebaMaximoAlcanzado'] = "test".repeat(100);
        localStorage.removeItem('pruebaMaximoAlcanzado');

        return true;
    } catch (e) {
        return false;
    }
}

function getLocalStorageSize() {
    return JSON.stringify(localStorage).length;
}

function guardaTextoEnNota(numPost, enteredText) {
    try {
        localStorage["postit" + numPost] = enteredText;
    } catch (e) {
        if (getLocalStorageSize() + enteredText.length > MAX_CHROME_LOCAL_STORAGE_SIZE) {
            sweetAlert({
                type: 'error',
                text: chrome.i18n.getMessage('noMasEspacio')
            });
        }

        console.log(e);
    }
}

// Ejecuta callback con el color del background;
function detectColorBackground(callback) {
    var img = document.createElement('img');

    var elem = document.getElementById('Postits');
    var style = elem.currentStyle || window.getComputedStyle(elem, false);

    if (style.backgroundImage.indexOf('://') > -1 && style.backgroundImage.indexOf('noise') == -1) {
        img.src = style.backgroundImage.slice(4, -1).replace(/"/g, "");

        img.onload = function () {
            $.adaptiveBackground.run({
                selector: img,
                success: function ($img, data) {
                    callback(colourBrightness(data.color));
                },
            })
        }
    } else {
        callback(colourBrightness(style.backgroundColor));
    }
}

function colourBrightness(color) {
    var rgb = color.substring(4, color.length - 1)
        .replace(/ /g, '')
        .split(',');

    var contrast = Math.round(((parseInt(rgb[0]) * 299) +
        (parseInt(rgb[1]) * 587) +
        (parseInt(rgb[2]) * 114)) / 1000);

    return (contrast > 125) ? '#333' : 'white';
}


var defaultColorContrastBackground = '#333';

function detectColorContrastBackground() {
    let promise;

    promise = new Promise((resolve, reject) => {
        detectColorBackground((colorBackground) => {
            resolve(defaultColorContrastBackground = colorBackground);
        })
    })

    return promise;
}

// Retorna dos números aleatorios entre min y max ambos inclusive
function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max + 1 - min)) + min;
}

function iniLocalStorageCaptureData() {
    localStorage.removeItem('imageSave');
    localStorage.removeItem('capturaPantalla');
    localStorage.removeItem('capturaVideo');
}

function isUserConnected() {
    return localStorage["sincroLogin"] == "true"
}

function resizeWindow(winId, width, height) {
    if (isChromeExtension()) {
        chrome.runtime.sendMessage({resizeWindow: {winId, width, height}});
    } else {
        window.resizeTo(width, height);
    }
}

function getRandomNoteType() {
    return TIPOS_NOTAS_RANDOM[getRandomNumber(0, TIPOS_NOTAS_RANDOM.length - 1)];
}

function esBackground() {
    return document.URL.indexOf('background') > 0;
}

function traduceLiteralesHtml() {
    document.querySelectorAll('[data-locale]').forEach(elem => {
        elem.innerText = chrome.i18n.getMessage(elem.dataset.locale)
    })
}

function tieneNotaAlturaAuto(numPost) {
    return localStorage['height' + numPost] == 'auto';
}

function getAlturaNota(numPost) {
    const DEFAULT_HEIGHT = 300;

    const getAproxHeight = () => {
        const aproxHeight = localStorage["postit" + numPost].length / 2;

        return DEFAULT_HEIGHT > aproxHeight ? DEFAULT_HEIGHT : aproxHeight;
    }

    return tieneNotaAlturaAuto(numPost) ? $('#postit' + numPost)?.height() || getAproxHeight() : parseInt(localStorage['height' + numPost]);
}

function restaurarMedidasAutoNota(numPost) {
    $('#postit' + numPost).height('auto');
    $("#texto" + numPost).css('maxHeight', 'calc(95vh - 90px)');
}

function getBoardNumberParam() {
    return new URL(window.location.href).searchParams.get('boardNumber');
}

function setNewTab(numTab, hideBar) {
    localStorage['new-tab'] = JSON.stringify({numTab, hideBar});
}

function getNewTab() {
    let newTab = false;

    if (localStorage['new-tab']) {
        try {
            newTab = JSON.parse(localStorage['new-tab']);
        } catch (err) {
            console.log(err);
        }
    }

    return newTab;
}

function getGridData() {
    var grid = false;

    if (localStorage['grid-drag']) {
        try {
            grid = {
                x: localStorage['grid-drag'].split('x')[0],
                y: localStorage['grid-drag'].split('x')[1]
            };
        } catch (err) {
            console.log(err);
        }
    }

    return grid;
}

function addNopubli() {
    $noPubli = $('#cansadoAnun');

    if ($noPubli.length) {
        $noPubli.html(chrome.i18n.getMessage("quitaAnuncios"));
        $noPubli.on('click', () => muestraMensajeHaztePremium());
    }
}

function isWebNotesBoard(numTablon = tablonActual) {
    return numTablon == WEBNOTES_BOARD;
}

function isFunction(func) {
    if (func && typeof func === "function") {
        return true
    }
    return false
}

function addScalable() {
    isMobile() && document.querySelector("meta[name=viewport]").setAttribute('content', 'width=device-width, initial-scale=1, user-scalable=yes');
}

function removeScalable() {
    isMobile() && document.querySelector("meta[name=viewport]").setAttribute('content', 'width=device-width, initial-scale=1, user-scalable=no');
}

function getHashUrl(url) {
    return url.substr(url.indexOf('#') + 1);
}

function getLocaleDate(dataString) {
    if (!dataString) return;

    const arrayDate = dataString.split('-');
    const date = new Date(arrayDate[1] + '/' + arrayDate[0] + '/' + arrayDate[2]);

    return date.toLocaleDateString(navigator.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function topBarHasBoards() {
    return localStorage['showTabs'] === TOP_BAR.BOARDS;
}

function isServiceWorker() {
    return 'ServiceWorkerGlobalScope' in self && self instanceof ServiceWorkerGlobalScope;
}
