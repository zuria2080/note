var tablonActual = localStorage['tablonActual'];
var imagenResultado;

var capturaPantalla = JSON.parse(localStorage['capturaPantalla']);

$(document).ready(function() {
  traduceLiteralesHtml();

  $('#captura').attr('src', capturaPantalla.imagen)
    .Jcrop({
      onSelect: capturaCoordenadas,
      onChange: function(coord) {
        if (coord.w == 0 && coord.h == 0 && coord.x == 0 && coord.y == 0 ) {
          return false;
        }
        $("#clickAndDrag").hide();
      },
      canResize: false,
      fadeDuration: 0,
      bgOpacity: 0.7,
      minSize: [0,0],
      setSelect: [ -1, -1, -1, -1 ]
    });

    $(".area-imagen-captura").mousemove(function(e) {
      $("#clickAndDrag").css({
        top: (e.pageY + 15) + "px",
        left: (e.pageX + 15) + "px"
      });
    });
});

function traduceLiteralesHtml() {
  document.querySelectorAll('[data-locale]').forEach(elem => {
    elem.innerText = chrome.i18n.getMessage(elem.dataset.locale)
  })
}

function capturaCoordenadas(coord) {
  if (coord.w == 0 && coord.h == 0 && coord.x == 0 && coord.y == 0 ) {
    return false;
  }

  imagenResultado = getImagePortion(document.getElementById('captura'), coord.w, coord.h, coord.x, coord.y);

  if (imagenResultado) {
    var mensaje = {
      imagenResultadoCrop: imagenResultado,
      url: capturaPantalla.url,
    };

    chrome.runtime.sendMessage(mensaje);
    window.close();
  }
}

function getImagePortion(imgObj, newWidth, newHeight, startX, startY, ratio){
    /* the parameters: - the image element - the new width - the new height - the x point we start taking pixels - the y point we start taking pixels - the ratio */
    var ratio = imgObj.width / document.getElementById('captura').width;
    //set up canvas for thumbnail
    var tnCanvas = document.createElement('canvas');
    var tnCanvasContext = tnCanvas.getContext('2d');
    tnCanvas.width = newWidth; tnCanvas.height = newHeight;

    /* use the sourceCanvas to duplicate the entire image. This step was crucial for iOS4 and under devices. Follow the link at the end of this post to see what happens when you don’t do this */
    var bufferCanvas = document.createElement('canvas');
    var bufferContext = bufferCanvas.getContext('2d');
    bufferCanvas.width = imgObj.width;
    bufferCanvas.height = imgObj.height;
    bufferContext.drawImage(imgObj, 0, 0);

    /* now we use the drawImage method to take the pixels from our bufferCanvas and draw them into our thumbnail canvas */
    tnCanvasContext.drawImage(imgObj, (startX * ratio),startY * ratio,newWidth * ratio, newHeight * ratio,0,0,newWidth,newHeight);

    return tnCanvas.toDataURL('image/jpeg');
}
