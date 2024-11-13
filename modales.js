var modalInstance;

function abrirPantallaModal(content, options) {
    options.zindex = options.zindex || 10000000;

    var dialogElement = options.dialogElement || 'dialog-confirm';

    if (options.buttons) {
        content = anyadirBotonesYIcono(content, options.buttons, options.icon, options.center);
    }

    if (options.header) {
        content = anyadirHeader(content, options.header);
    }

    $('#' + dialogElement).html(content);

    M.Modal.init(document.getElementById(dialogElement), {
        // dismissible: false,  ? no se cierra al hacer click
        // endingTop: isSmallScreen() ? '0%' : '4%',
        onOpenStart: function () {
            $(".modal-overlay").css('z-index', options.zindex);
            $('.botones, .tablonPostits').addClass('blur-effect');

            $('#' + dialogElement).css({
                'z-index': options.zindex + 1,
                // 'min-width': (options.minWidth || 800) + 'px',
                // 'min-height': (options.minHeight || 580) + 'px'
            });

            options.height && $('.modal.modal-fixed-footer').height(options.height);
            options.width && $('.modal.modal-fixed-footer').width(options.width);
            options.maxWidth && $('.modal.modal-fixed-footer').css('max-width', options.maxWidth);
            options.maxHeight && $('.modal.modal-fixed-footer').css('max-height', options.maxHeight);
            options.minHeight && $('.modal.modal-fixed-footer').css('min-height', options.minHeight);

            options.onOpenStart && options.onOpenStart();
            $('select').formSelect();

            initMaterializeComponents();

            if (options.buttons) {
                asignaCallbacksBotones(options.buttons);
            }
        },
        onOpenEnd: function () {
            M.updateTextFields();
            $(".modal-overlay").css('z-index', options.zindex);
            $('.btn-crea-nota').hide();

            options.height && $('.modal.modal-fixed-footer').height(options.height);
            options.width && $('.modal.modal-fixed-footer').width(options.width);
            options.maxHeight && $('.modal.modal-fixed-footer').css('max-height', options.maxHeight);
            options.onOpenEnd && options.onOpenEnd();
            if (options.icon) {
                $('.modal-content').css('top', '0');
            }

            activarClaseActivaInputs();

            if ($('#movilAdd').length > 0) {
                $('.modal').addClass('adds-movil');
            }

            isMobile() && (window.location.hash = 'modal');

            // if (isSmallScreen()) {
            //   $('.modal.modal-fixed-footer').height(window.innerHeight);
            //   $('.modal.modal-fixed-footer').width(window.innerWidth);
            //   // $('#' + dialogElement).css({
            //   //   'top':0,
            //   //   // 'min-width': (options.minWidth || 800) + 'px',
            //   //   // 'min-height': (options.minHeight || 580) + 'px'
            //   // });
            // }
        },
        onCloseEnd: function () {
            options.onCloseEnd && options.onCloseEnd();

            $('.botones, .tablonPostits').removeClass('blur-effect');
            $('.btn-crea-nota').show();
            isMobile() && (window.location.hash = '');
        },
        opacity: 0.5
    });

    if (options.newModalInstance) {
        var newModalInstance = M.Modal.getInstance(document.getElementById(dialogElement));
        newModalInstance.open();
        return newModalInstance;
    } else {
        modalInstance = M.Modal.getInstance(document.getElementById(dialogElement));
        modalInstance.open();
    }
}

function anyadirHeader(content, header) {
    var html = `
    <div class="modal-header">
      <div class="title-container">
        ${header.icon ? `<i class="material-icons icono">${header.icon}</i>` : ''}
        <h4 class="modal-title">${header.title}</h4>
      </div>
    </div>
    ${content}
    `

    return html;
}

function anyadirBotonesYIcono(content, buttons, icon, center) {
    var buttonsHtml = ''
    var iconHtml = ''

    if (buttons.list) {
        for (var i = 0; i < buttons.list.length; i++) {
            buttonsHtml += `<button class="btn waves-effect waves-light ${buttons.list[i].color ? buttons.list[i].color : 'grey darken-1'} " id="button${i}">${buttons.list[i].text}</button>`
        }
    }

    if (icon) {
        var iconText = '';

        switch (icon) {
            case 'info':
                iconText = `<span class="swal2-icon-text">i</span>`;
                break;
            case 'question':
                iconText = `<span class="swal2-icon-text">x</span>`;
                break;
            case 'error':
                iconText = '<span class="swal2-x-mark"><span class="swal2-x-mark-line-left"></span><span class="swal2-x-mark-line-right"></span></span>';
                break;
        }
        iconHtml = `<div class="swal2-icon swal2-${icon} swal2-animate-${icon}-icon" style="display: flex;">${iconText}</div>`;
    }

    var html = `
    <div class="modal-content modal-custom ${center ? 'center' : ''}">
      ${iconHtml}
      ${content}
    </div>
    <div class="modal-footer">
      ${buttonsHtml}
      ${buttons.cancelButton ? `<a href="#!" class="modal-close waves-effect waves-gray btn-flat grey-text text-darken-2" id="cancelar-fondo">${chrome.i18n.getMessage('cancelar')}</a>` : ''}
    </div>`

    return html;
}

function asignaCallbacksBotones(buttons) {
    if (buttons.list) {
        for (var i = 0; i < buttons.list.length; i++) {
            $('#button' + i).on('click', buttons.list[i].callback)
        }
    }
}

function sweetAlert(options) {
    // type: warning, error, success, info, question
    swal({
        // title: 'Error',
        html: options.text,
        type: options.type || 'question',
        buttonsStyling: false,
        width: options.width,
        confirmButtonText: options.confirmText || chrome.i18n.getMessage("aceptar"),
        confirmButtonClass: options.confirmButtonClass || 'btn waves-effect waves-light grey darken-1',
        showCancelButton: (options.cancel !== false),
        cancelButtonText: options.cancelText || chrome.i18n.getMessage("cancelar"),
        cancelButtonClass: 'btn waves-effect waves-light black-text grey lighten-3',
        backdrop: 'rgba(0,0,0,0.7)',
        onOpen: function () {
            $('.botones, .tablonPostits').addClass('blur-effect');

            // si es un texto largo quitamos centrado
            if (options.text.length > 400) {
                $('.swal2-popup #swal2-content').addClass('leftAlign');
            }
        },
        onClose: function () {
            $('.botones, .tablonPostits').removeClass('blur-effect');
        }
    }).then(function (result) {
        if (result.value) {
            if (options.successCallback) {
                options.successCallback()
            }
        } else {
            if (options.cancelCallback) {
                options.cancelCallback()
            }
        }
    });
}

function initMaterializeComponents() {
    const textFields = document.querySelectorAll('.mdc-text-field');
    const selectFields = document.querySelectorAll('.mdc-select');

    for (const textField of textFields) {
        if ($(textField).find('input').length > 0 || $(textField).find('textarea').length > 0) {
            try {
                mdc.textField.MDCTextField.attachTo(textField);
            } catch (e) {
                console.log(e)
            }
        }
    }

    for (const selectField of selectFields) {
        try {
            mdc.select.MDCSelect.attachTo(selectField);

            // apaño para solucionar que la label flotante mientras no tiene el foco no tiene width
            $(selectField).find('.mdc-notched-outline__notch').width('auto');
            // setTimeout(function() {
            //   var labelWidth = $(selectField).find('.mdc-notched-outline__notch .mdc-floating-label').width();
            //   $(selectField).find('.mdc-notched-outline__notch').width(labelWidth);
            // }, 100);
        } catch (e) {
            console.log(e)
        }
    }
}

function openSnackbar({
                          text = '',
                          action = '',
                          action2 = '',
                          action2Callback = () => {
                          },
                          actionCallback = () => {
                          },
                          dismiss = true,
                          dismissCallback = () => {
                          },
                          stacked = false,
                          timeout = 0
                      } = {}) {
    var html =
        `<div class="mdc-snackbar ${stacked ? 'mdc-snackbar--stacked' : ''}" id="mdc-snackbar">
    <div class="mdc-snackbar__surface">
    <div class="mdc-snackbar__label"
      role="status"
      aria-live="polite">
      ${text}
    </div>
    <div class="mdc-snackbar__actions">
      ${action2 ? `<button type="button" id="mdc-snackbar_action2" class="mdc-button mdc-snackbar__action2">${action2}</button>` : ''}
      ${action ? `<button type="button" class="mdc-button mdc-snackbar__action">${action}</button>` : ''}
      ${dismiss ? '<button type="button" class="mdc-icon-button mdc-snackbar__dismiss material-icons">close</button>' : ''}
    </div>
      </div>
    </div>`

    $('body').append(html);
    var snackbarDomElement = document.getElementById('mdc-snackbar');
    var MDCSnackbar = mdc.snackbar.MDCSnackbar;
    var snackbar = new MDCSnackbar(snackbarDomElement);

    if (timeout) {
        snackbar.timeoutMs = timeout;
    }
    snackbar.open();

    if (action2) {
        $('#mdc-snackbar_action2', snackbarDomElement).on('click', () => {
            isFunction(action2Callback) && action2Callback();
        })
    }

    snackbarDomElement.addEventListener('MDCSnackbar:closed', (event) => {
        switch (event.detail.reason) {
            case 'action':
                isFunction(actionCallback) && actionCallback();
                break;
            case 'dismiss':
                isFunction(dismissCallback) && dismissCallback();
                break;
        }

        $('#mdc-snackbar').remove();
    })
}

function muestraMensajeModal(texto) {
    $('.mensaje-modal').text(texto).fadeOut(500).fadeIn(500)
}

function getInputHtml({id, label, type, icon, helperLine}) {
    var html = `
    <div class="mdc-text-field nb-full-width mdc-text-field--outlined mdc-text-field--with-leading-icon">
    ${icon ? '<i class="material-icons mdc-text-field__icon">' + icon + '</i>' : ''}
    <input id="${id}" type=${type} name="${id}" class="mdc-text-field__input" />
    <div class="mdc-notched-outline">
      <div class="mdc-notched-outline__leading"></div>
      <div class="mdc-notched-outline__notch">
        <label class="mdc-floating-label">${label}</label>
      </div>
      <div class="mdc-notched-outline__trailing"></div>
    </div>
  </div>
  ${helperLine ? '<div class="mdc-text-field-helper-line"><div class="mdc-text-field-helper-text">' + helperLine + '</div></div>' : ''}
  `
    return html;
}

function getOptionsHtml(options) {
    let html = '';

    for (const option of options) {
        html += `<li class="mdc-list-item ${option.selected ? 'mdc-list-item--selected' : ''}" data-value="${option.value}">
                ${option.text}
            </li>`
    }

    return html;
}

function getSelectHtml({id, label, options}) {
    var html = `<div class="mdc-select mdc-select--outlined nb-select-width">
  <input id="${id}" type="hidden" name="${id}">
  <i class="mdc-select__dropdown-icon"></i>
  <div class="mdc-select__selected-text"></div>
  <div class="mdc-select__menu mdc-menu mdc-menu-surface nb-select-width">
    <ul class="mdc-list">
      ${getOptionsHtml(options)}
    </ul>
  </div>
  <div class="mdc-notched-outline">
    <div class="mdc-notched-outline__leading"></div>
    <div class="mdc-notched-outline__notch">
      <label class="mdc-floating-label mdc-floating-label--float-above" style="">${label}</label>
    </div>
    <div class="mdc-notched-outline__trailing"></div>
  </div>
  </div>`;

    return html;
}

function activarClaseActivaInputs() {
    $('input[type=text], input[type=password], input[type=email], input[type=url], input[type=tel], input[type=number], input[type=search], input[type=date], input[type=time], textarea', '.modal-content').each(function (element, i) {
        if ($(this).val()) {
            $(this).parent().find('.mdc-notched-outline').addClass('mdc-notched-outline--notched');
            $(this).parent().find('label').addClass('mdc-floating-label--float-above');
        }
        // else {
        //     $(this).siblings('label').removeClass('active');
        // }
    });
}

function muestraAyudaSnackbar(mens) {
    if (localStorage[mens] != "false") {
        openSnackbar({
            text: chrome.i18n.getMessage(mens),
            action: chrome.i18n.getMessage('noMostrarMas'),
            actionCallback: () => {
                localStorage[mens] = "false";
            }
        });
    }
}

function showNewFeature(mens, url, major) {
    if (localStorage[mens] != "false") {
        if (major) {
            abrirPantallaModal(chrome.i18n.getMessage(mens), {
                icon: 'info',
                buttons: {
                    cancelButton: true,
                    list: [
                        {
                            text: chrome.i18n.getMessage("masInfo"),
                            callback: function () {
                                chrome.tabs.create({url: 'https://www.noteboardapp.com/' + url});
                                localStorage[mens] = "false";
                                modalInstance.close();
                            }
                        },
                        {
                            text: chrome.i18n.getMessage("noMostrarMas"),
                            callback: function () {
                                localStorage[mens] = "false";
                                modalInstance.close();
                            }
                        }
                    ]
                },
                height: 500,
                width: 750
            });
        } else {
            openSnackbar({
                text: chrome.i18n.getMessage(mens),
                action: chrome.i18n.getMessage('noMostrarMas'),
                action2: chrome.i18n.getMessage('masInfo'),
                action2Callback: () => {
                    chrome.tabs.create({url: 'https://www.noteboardapp.com/' + url});
                },
                actionCallback: () => {
                    localStorage[mens] = "false";
                },
                stacked: true,
                timeout: 8000
            });
        }
    }
}

function muestraAyuda(mens, tipo = 'info') {
    if (localStorage[mens] != "false") {
        sweetAlert({
            type: tipo,
            text: chrome.i18n.getMessage(mens),
            confirmText: chrome.i18n.getMessage('noVolverMostrar'),
            cancel: true,
            cancelText: chrome.i18n.getMessage('aceptar'),
            successCallback: function () {
                localStorage[mens] = "false";
            }
        });
    }
}

async function promptFields(options = {}) {
    return await Swal.fire({
        title: options.title || 'no title',
        input: options.inputType || 'text',
        showCancelButton: true
    })
}

function getCalendarDateModal() {
    return new Promise(resolve => {
        const html = obtenerFormularioCalendarPlugin();

        abrirPantallaModal(html, {
            onOpenStart: function () {
                var d = new Date();
                $('#datepicker').val(d.getDate() + '.' +  (d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + d.getHours() + ':' + d.getMinutes());
                jQuery('#datepicker').datetimepicker({
                    format:'d.m.Y H:i',
                    inline: true,
                    step: 5,
                    minDate: 0,
                    dayOfWeekStart: 1
                });
                $.datetimepicker.setLocale(window.navigator.language||navigator.browserLanguage);


                $('#accept-date').off().on('click', () => {
                    const date = $('#datepicker').datetimepicker('getValue');

                    const resultDate = date.toLocaleString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false // Para usar el formato de 24 horas
                    });
                    const result = {
                        dismiss: false,
                        value: resultDate
                    };
                    resolve(result);
                    modalInstance.close();
                });
            },
            width: 350,
            maxHeight: '450px',
            minHeight: '450px',
            dialogElement: 'dialog-calendar'
        });
    });
}