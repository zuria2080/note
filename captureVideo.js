var tablonActual = localStorage['tablonActual'];

$(document).ready(function() {
  traduceLiteralesHtml();

  M.AutoInit();

  $('#captura').attr('src', localStorage['capturaVideo']);

  $('#botonAceptar').on('click', function() {
    chrome.permissions.request({ origins: ['https://www.noteboardapp.com/'] }, function (granted) {
      if (granted) {
        chrome.runtime.sendMessage({
          capturaVideoResultado: $('#listaTablones').val(),
          textoVideo: $('#textoCompartir').val(),
          abrir: $('#abrir').is(':checked'),
          numNota: parseInt($('#numNota').val())-1
        });

        $('#botonAceptar').attr('disabled', true);

        $('.progress').show();

      }
    });

    chrome.runtime.onMessage.addListener(
      function(request, sender) {
        if (request.videoUploadEnd) {
          window.close();
        }
      }
    );
  });

  $('#tablones').html(getSelectHtml({
    id: 'listaTablones',
    label: chrome.i18n.getMessage('imageSave_tablon'),
    options: listaTablones()
  }));

  $('#numNota').attr('max', localStorage['totalPost']);

  initMaterializeComponents();

  $('#numNota').on('keyup change', function(evt) {
    if ($(this).val() || $(this).val() === '0') {
      $('#tablones select').attr('disabled', true);
      $('#botonAceptar').text(chrome.i18n.getMessage('videoCap_anyadirVideoNota') + $(this).val());

      if (parseInt($(this).val()) > parseInt(localStorage['totalPost'])) {
        $('#botonAceptar').attr('disabled', true);
        $('.error-message').text(chrome.i18n.getMessage('imageSave_anyadirImagenNotaError',localStorage['totalPost'])).show();
      } else {
        $('#botonAceptar').attr('disabled', false);
        $('.error-message').hide();
      }
    } else {
      $('#tablones select').attr('disabled', false);
      $('select').formSelect();
      $('#botonAceptar').text(chrome.i18n.getMessage('imageSave_crear'));
    }
  });

  chrome.permissions.contains({ origins: ['https://www.noteboardapp.com/'] }, function (granted) {
    if (!granted) {
      $('.instructions').html($('.instructions').html() + chrome.i18n.getMessage("permisosVideo"));
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
