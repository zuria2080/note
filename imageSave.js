
var tablonActual = localStorage['tablonActual'];

var imageSave = JSON.parse(localStorage['imageSave']);

$(document).ready(function() {
  traduceLiteralesHtml();

  if (imageSave.imagen.indexOf('http') > -1) {
    $('#botonVolver').hide();
  }

  var img = document.getElementById('captura');
  img.onload = function(){
    $('#captura').addClass('captura-loaded')
  };
  img.src = imageSave.imagen;

  if (imageSave.url) {
    $('#url-captura').html(imageSave.url).attr('href', imageSave.url);
  } else {
    $('.link-section').hide();
  }

  if ((localStorage['numeroNotaEnEdicion'] || localStorage['numeroNotaEnEdicion'] == "0") && localStorage['numeroNotaEnEdicion'] != "null") {
    $('.nota-en-edicion').show();
  }

  $('#botonAceptar').on('click', function() {
    var mensaje = {
      cropSalva: imageSave.imagen,
      numTablon: $('#listaTablones').val(),
      url: imageSave.url,
      linkImagen: $('#linkImagen').is(':checked'),
      linkTexto: $('#linkTexto').is(':checked'),
      abrir: $('#abrir').is(':checked'),
      numNota: parseInt($('#numNota').val())-1,
      textoImagen: $('#textoImagen').val(),
      notaEnEdicion: $('#nota-en-edicion').is(':checked')
    };

    chrome.runtime.sendMessage(mensaje);
    window.close();
  });

  $('#botonVolver').on('click', function() {
    window.close();
    chrome.tabs.create({url:'cropScreen.html'});
  });

  // $('#tablones').html(selectDeTablones(true))
  $('#tablones').html(getSelectHtml({
    id: 'listaTablones',
    label: chrome.i18n.getMessage('imageSave_tablon'),
    options: listaTablones()
  }));

  // $('select').formSelect();

  $('#numNota').attr('max', localStorage['totalPost']);

  initMaterializeComponents();

  $('#numNota').on('keyup change', function(evt) {
    if ($(this).val() || $(this).val() === '0') {
      $('#tablones select').attr('disabled', true);
      // $('select').formSelect();
      $('#botonAceptar').text(chrome.i18n.getMessage('imageSave_anyadirImagenNota') + $(this).val());

      if (parseInt($(this).val()) > parseInt(localStorage['totalPost'])) {
        $('#botonAceptar').attr('disabled', true);
        $('.error-message').text(chrome.i18n.getMessage('imageSave_anyadirImagenNotaError',localStorage['totalPost'])).show();
      } else {
        $('#botonAceptar').attr('disabled', false);
        $('.error-message').hide();
      }
    } else {
      $('#tablones select').attr('disabled', false);
      $('#botonAceptar').attr('disabled', false);
      $('select').formSelect();
      $('#botonAceptar').text(chrome.i18n.getMessage('imageSave_crear'));
    }
  });

  $('#nota-en-edicion').on('change', function () {
    if ($('#nota-en-edicion').is(':checked')) {
      $('#botonAceptar').text(chrome.i18n.getMessage('imageSave_anyadirEdicion'));
    } else {
      $('#botonAceptar').text(chrome.i18n.getMessage('imageSave_crear'));
    }
	});
});

function initMaterializeComponents() {
  const textFields = document.querySelectorAll('.mdc-text-field');

  try {
    for (const textField of textFields) {
      if ($(textField).find('input').length > 0) {
        mdc.textField.MDCTextField.attachTo(textField);
      }
    }
  } catch(e) {
    console.log(e);
  }
}
