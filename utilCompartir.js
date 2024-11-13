//------------------------------------------------------------------------------------------
//---------------------------UTILIDADES VARIAS ---------------------------------------------
//------------------------------------------------------------------------------------------

// comprobar si el elemento ya está en comparticiones para evitar repetidos
function contieneComp(elem, comparticiones) {
  for (var i = 0; i < comparticiones.length; i++) {
    if (comparticiones[i].id_usuarioComp == elem.id_usuarioComp &&
      comparticiones[i].tabComp == elem.tabComp &&
      comparticiones[i].permisos == elem.permisos)
      return true;
  }
  return false;
}

// devuelve el número de invitaciones no tratadas
function invitacionesPorTratar() {
  if (localStorage["invitaciones"] == undefined) return 0;
  var invitaciones = JSON.parse(localStorage["invitaciones"]);
  var numInvi = 0;
  for (var i = 0; i < invitaciones.length; i++) {
    if (!invitaciones[i].tratada) numInvi++
  }
  return numInvi;
}

// para saber si el tablón ya está compartido con el nick
function yaCompartido(nick, tablon) {
  if (localStorage["comparticiones"] == undefined) return false;
  var comparticiones = JSON.parse(localStorage["comparticiones"]);
  for (var i = 0; i < comparticiones.length; i++) {
    if (comparticiones[i].nickComp == nick &&
      comparticiones[i].tabComp == tablon)
      return true;
  }
  return false;
}

// comprueba si el tablón está compartido con alguien
function esTabCompartido(numTab = tablonActual) {
  if (localStorage["comparticiones"] == undefined || !isUserConnected()) return false;

  var comparticiones = JSON.parse(localStorage["comparticiones"]);

  for (var i = 0; i < comparticiones.length; i++) {
    if (comparticiones[i].tabComp == numTab)
      return true;
  }

  return false;
}

function getTablonCompartidoLocal(numTab) {
  if (!localStorage["comparticiones"] || !isUserConnected()) return -1;

  var comparticiones = JSON.parse(localStorage["comparticiones"]);

  for (var i = 0; i < comparticiones.length; i++) {
    if (comparticiones[i].tabCompRemoto == numTab)
      return comparticiones[i].tabComp;
  }

  return -1;
}

function esNotaCompartida(numPost) {
  return !!localStorage["userComp" + numPost];
}

function borraComparticion(numTab) {
  var comparticiones = JSON.parse(localStorage["comparticiones"]);

  for (var i = 0; i < comparticiones.length; i++) {
    if (comparticiones[i].tabComp == numTab)
      comparticiones.splice(i, 1);
  }

  localStorage["comparticiones"] = JSON.stringify(comparticiones);
}

function selectDeTablones(actual, numPost) {
  var mens = '<select id="listaTablones">';

  if (actual) {
    if (tablonActual != '0')
      mens += '<option orden="' + ordenTablon(tablonActual) + '" value="' + tablonActual + '">' + nombreTablon(tablonActual) + '</option>';
  }
  else mens += '<option value="' + (parseInt(localStorage["numTablones"]) + 1) + '">' + chrome.i18n.getMessage("labelAdd") + '</option>';

  for (var i = 1; i <= localStorage["numTablones"]; i++) {
    if (!actual || i != tablonActual)
      mens += '<option orden="' + ordenTablon(i) + '" value="' + i + '">' + nombreTablon(i) + '</option>';
  }

  if (esNotaWeb(numPost))
    mens += '<option value="' + -999 + '">' + nombreTablon(-999) + '</option>';

  mens += '</select>';

  return mens;
}

function listaTablones(mostrarAdd = false, mostrarLast = false) {
  const sortBy = (key) => {
    return (a, b) => (a[key] > b[key]) ? 1 : ((b[key] > a[key]) ? -1 : 0);
  };

  var listaTablones = [];

  if (mostrarLast) {
    listaTablones.push({ text: chrome.i18n.getMessage("ultimoTablonActual"), value: 0, orden: 0, selected: true});
  }

  if (mostrarAdd) {
    listaTablones.push({ text: chrome.i18n.getMessage("labelAdd"), value: (parseInt(localStorage["numTablones"]) + 1) });
  }

  for (var i = 1; i <= localStorage["numTablones"]; i++) {
    listaTablones.push({
      text: nombreTablon(i),
      value: i,
      orden: parseInt(ordenTablon(i)),
      selected: tablonActual == 0 && !mostrarLast ? i == 1 : tablonActual == i
    });
  }

  if (algunaNotaWeb()) {
    listaTablones.push({
      text:  nombreTablon(-999),
      value: '-999',
      orden: 9999,
      selected: tablonActual == '-999'
    });
  }

  return listaTablones.sort(sortBy('orden'));
}

function tablaInvitacionesEnviadas() {
  var html = '';
  if (localStorage["invEnviadas"] == undefined) return html;
  var invEnviadas = JSON.parse(localStorage["invEnviadas"]);
  if (invEnviadas.length == 0) return html;

  html = '<table>'
  html += '<tr>';
  html += '<th>' + chrome.i18n.getMessage("tablon") + '</th>';
  html += '<th>' + chrome.i18n.getMessage("user") + '</th>';
  html += '<th>' + chrome.i18n.getMessage("permisos") + '</th>';
  html += '<th>' + chrome.i18n.getMessage('anular') + '</th>';
  html += '</th>';


  for (var i = 0; i < invEnviadas.length; i++) {
    html += '<tr id="lineaInv' + i + '" title="' + invEnviadas[i].mensaje + '">';

    if (localStorage['tab' + invEnviadas[i].tablon + 'Label'] != undefined && localStorage['tab' + invEnviadas[i].tablon + 'Label'] != "undefined")
      html += '<td>' + localStorage['tab' + invEnviadas[i].tablon + 'Label'] + '</td>';
    else
      html += '<td>' + chrome.i18n.getMessage("tablon") + invEnviadas[i].tablon + '</td>';

    if (invEnviadas[i].user != '')
      html += '<td>' + invEnviadas[i].user + '</td>';
    else {
      if (invEnviadas[i].mail.indexOf('@') > 0)
        html += '<td>' + invEnviadas[i].mail + '</td>';
      else
        html += '<td>Facebook</td>';
    }
    html += '<td>' + chrome.i18n.getMessage(invEnviadas[i].permisos) + '</td>';
    html += '<td><button class="anulInvBut waves-effect waves-light btn-small teal lighten-2" id="anulInv' + i + '">' + chrome.i18n.getMessage("anularBot") + '</button></td>';
    html += '</tr>';
  }
  html += '</table>';
  return html;
}

/**
 * Se añade la invitación enviada
 * @param {[type]} userInvitado [description]
 * @param {[type]} tablon       [description]
 * @param {[type]} mensaje      [description]
 * @param {[type]} permisos     [description]
 */
function addInvEnviadas(userInvitado, id_usuarioInv, tablon, mensaje, permisos) {
  if (localStorage["invEnviadas"] == undefined)
    var invEnviadas = new Array();
  else
    var invEnviadas = JSON.parse(localStorage["invEnviadas"]);

  var invObj = {
    mail: userInvitado.indexOf('@') > -1 ? userInvitado : '',
    mensaje: mensaje,
    permisos: permisos,
    tablon: tablon,
    user: userInvitado.indexOf('@') == -1 ? userInvitado : '',
    id_usuario2: id_usuarioInv
  }
  invEnviadas.push(invObj);
  localStorage["invEnviadas"] = JSON.stringify(invEnviadas);
}


function eliminaCompartidos() {
  var i = 0;

  while (i < localStorage["totalPost"]) {
    if (localStorage["userComp" + i] != undefined)
      borrarConfirmado(i, true);
    else i++;
  }
  localStorage.removeItem("comparticiones");
  localStorage.removeItem("invitaciones");
  localStorage.removeItem("invEnviadas");
  inicializaFriendsBot();
}

function showAjaxGif() {
  $("#black_overlay").show();
}

function hideAjaxGif() {
  $("#black_overlay").hide();
}

function guardaPosCompartido(numPost) {
  posCompartidas["X" + localStorage["treeId" + numPost]] = localStorage["X" + numPost];
  posCompartidas["Y" + localStorage["treeId" + numPost]] = localStorage["Y" + numPost];
}

function recuperaPosCompartido(numPost) {
  if (posCompartidas["X" + localStorage["treeId" + numPost]] != undefined) {
    localStorage["X" + numPost] = posCompartidas["X" + localStorage["treeId" + numPost]];
    localStorage["Y" + numPost] = posCompartidas["Y" + localStorage["treeId" + numPost]];
  }
}