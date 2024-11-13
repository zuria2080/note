var canvas;
var context;
var cy = 0;
var SCROLLBAR_WIDTH = 22;
var STICKY_HEADER_PADDING = 200;
var screenShotData;

var NOTIFICATION_ICON_URL = "images/icons/default128.png";

function getScreenMedia(streamId) {
    return navigator.mediaDevices.getUserMedia({
        /*
        width: { max: 1920 },
        height: { max: 1080 },
        frameRate: { max: 10 },
        deviceId: { exact: [sourceId] },
        mediaStreamSource: { exact: ['desktop'] }
        */
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: "desktop",
                chromeMediaSourceId: streamId,
                maxWidth: 2560,
                maxHeight: 1440
                //width: { min: 1024, ideal: 1280, max: 1920 },
                //height: { min: 776, ideal: 720, max: 1080 }
            }
        }
    });
}

function maybeStartAudioRecorder(params) { // popupwindow, enableMic
    params = initUndefinedObject(params);
    return new Promise((resolve, reject) => {
        if (params.enableMic) {
            // need to use popupwindow or else the user would not get prompted to accept/deny when called from background
            navigator.mediaDevices.getUserMedia({
                    audio: true
                })
                .then(audioStream => {
                    console.log("audioStream", audioStream);
                    resolve(audioStream);
                })
                .catch(error => {
                    reject(error);
                });
        } else {
            resolve();
        }
    });
}

function startVideoRecorder(videoStream, audioStream) {
    console.log("videostream", videoStream);
    return new Promise((resolve, reject) => {
        const bg = {};
        var video = document.createElement('video');
        document.body.appendChild(video);

        var VIDEO_CONTENT_TYPE = "video/webm";
        var blob;
        var chunks = [];
        var options = {
            mimeType: VIDEO_CONTENT_TYPE
        }

        if (audioStream) {
            videoStream.addTrack(audioStream.getAudioTracks()[0]);
        }

        // somebody clicked on "Stop sharing"
        videoStream.getVideoTracks()[0].onended = function() {
            if (bg.mediaRecorder.state != "inactive") {
                bg.mediaRecorder.stop();
            }
        };

        video.addEventListener('canplay', function() {
            //console.log("canplay");
        }, false);

        video.srcObject = videoStream;

        video.muted = true;
        video.play();

        bg.mediaRecorder = new MediaRecorder(videoStream, options);
        bg.mediaRecorder.start();
        bg.mediaRecorder.onstart = function(e) {
            chrome.action.setPopup({
                popup: ""
            });
            bg.recordingScreen = true;
        }
        bg.mediaRecorder.ondataavailable = function(e) {
            chunks.push(e.data);
        }
        bg.mediaRecorder.onwarning = function(e) {
            console.warn('mediarecord wraning: ' + e);
        };
        bg.mediaRecorder.onerror = function(e) {
            console.error('mediarecord error: ' + e);
            bg.recordingScreen = false;
            throw e;
        };
        bg.mediaRecorder.onstop = function(e) {
            bg.recordingScreen = false;

            videoStream.getTracks()[0].stop();

            blob = new Blob(chunks, {
                'type': VIDEO_CONTENT_TYPE
            });
            video.src = URL.createObjectURL(blob);
            video.controls = true;

            bg.screenShotTab = null;
            bg.screenShotData = video.src;
            screenShotData = video.src;

            bg.videoBlob = blob;
            chrome.runtime.sendMessage({videoBlob: blob});

            resolve(bg.screenShotData);
        }
    });
}

function recordScreen(params) {
    params = initUndefinedObject(params);
    localStorage.grabMethod = "recordScreen";

    return new Promise((resolve, reject) => {
        // patch: could not get both video and audio when using screencapture "chromeMediaSource" so we first the audio then the video and merge then with .addTrack below
        maybeStartAudioRecorder(params)
            .then(audioStream => {
                if (params.popupWindow) {
                    params.popupWindow.close();
                }
                chooseDesktopMedia(["screen", "window", "tab"])
                    .then(async streamId => {
                        chromeWindow = await chrome.windows.getCurrent();

                        await chrome.windows.update(chromeWindow.id, {
                            state: "minimized"
                        });
                        // wait for window to minimize
                        await sleep(1);
                        document.getElementById('message').style.display = 'block';

                        return getScreenMedia(streamId)
                            .then(videoStream => {
                                return startVideoRecorder(videoStream, audioStream);
                            });
                    })
                    .then(() => {
                        resolve();
                    })
                    .catch(error => {
                        console.error(error);
                        if (audioStream) {
                            audioStream.getTracks()[0].stop();
                        }
                        let errorMsg;
                        if (error.message) {
                            errorMsg = error.message;
                        } else {
                            errorMsg = error;
                        }
                        if (error.name != "cancelledDesktopCapture") {
                            showCouldNotCompleteActionNotification(errorMsg);
                        }
                        reject(error);
                    })
                    .then(() => {
                        // chrome.runtime.getBackgroundPage(bg => {
                        //     bg.cancelStayAlive();
                        // });
                    });
            }, audioError => { // this is an ELSE and will only catch the errors for maybeStartAudioRecorder
                console.error("error", audioError);

                // v2 was getting this new error "Failed due to shutdown" so decided to uncomment them all
                // v1 permission not granted to audio AND could not be prompted to either (probably inside popup window)
                //if (audioError.name == "MediaDeviceFailedDueToShutdown" || audioError.name == "PermissionDeniedError" || audioError.name == "PermissionDismissedError") {
                chrome.tabs.create({
                    url: 'promptForMic.html?error=' + audioError.name
                });
                //}
                reject(audioError);
            });
     });
}

function initUndefinedObject(obj) {
  if (typeof obj == "undefined") {
      return {};
  } else {
      return obj;
  }
}

function chooseDesktopMedia(params) {
  return new Promise((resolve, reject) => {
      chrome.desktopCapture.chooseDesktopMedia(params, (streamId, options) => {
          if (streamId) {
              // todo add options to resolve but resolve only accepts 1 param
              resolve(streamId);
          } else {
              let error = new Error("Cancelled desktop capture");
              error.name = "cancelledDesktopCapture";
              reject(error);
          }
      });
  });
}

function grabScreen(params) {
    params = initUndefinedObject(params);
    let chooseDesktopMediaParams;
    if (params.grabTab) {
        localStorage.grabMethod = "tab";
        chooseDesktopMediaParams = ["tab"];
    } else {
        localStorage.grabMethod = "screen";
        chooseDesktopMediaParams = ["screen", "window"];
    }
    return new Promise((resolve, reject) => {

        // since grabTab is async we get user gesture issue so use contains instead
        let method;
        if (params.grabTab) {
            method = "contains";
        } else {
            method = "request";
        }
        if (params.popupWindow) {
                params.popupWindow.close();
            }
            chooseDesktopMedia(chooseDesktopMediaParams)
                .then(streamId => {
                    return possibleDelay(params)
                        .then(() => {
                            return getScreenMedia(streamId)
                                .then(async (stream) => {
                                    chromeWindow = await chrome.windows.getCurrent();

                                    await chrome.windows.update(chromeWindow.id, {
                                        state: "minimized"
                                    });
                                    // wait for window to minimize
                                    await sleep(1);
                                    document.getElementById('message').style.display = 'block';


                                    let canPlayDetected;
                                    var video = document.createElement('video');
                                    video.addEventListener('loadeddata', function() {
                                        console.log("loadeddata")
                                    });
                                    video.addEventListener('playing', function() {
                                        console.log("playing")
                                    });
                                    video.addEventListener('error', function() {
                                        console.log("error", arguments)
                                    });
                                    video.addEventListener('abort', function() {
                                        console.log("abort", arguments);
                                    });
                                    video.addEventListener('canplay', function() {
                                        if (!canPlayDetected) {
                                            canPlayDetected = true;
                                            video.play();

                                            canvas = document.createElement('canvas');
                                            context = canvas.getContext('2d');

                                            canvas.width = video.videoWidth;
                                            canvas.height = video.videoHeight;

                                            context.drawImage(video, 0, 0, canvas.width, canvas.height);
                                            video.pause();
                                            video.src = '';
                                            stream.getTracks()[0].stop();
                                            video.remove();
                                            canvas.remove();

                                            var quality = (localStorage["sincroLogin"] === 'true' ? 70: 20) / 100;
                                            resolve(canvas.toDataURL('image/jpeg', quality));
                                        }
                                    }, false);
                                    video.srcObject = stream;
                                    console.log("video", video);
                                })
                        })
                })
                .catch(error => {
                    reject(error);
                });
    });
}

function possibleDelay(params) {
    params = initUndefinedObject(params);
    let delay;
    // chrome-extension pages will probably give an error later, so skip timer this time
    if (!params.grabTab && params.currentWindow && params.currentWindow.url && params.currentWindow.url.indexOf("chrome-extension://") != -1) {
        delay = null;
    } else {
        delay = params.delay;
    }
    return new Promise((resolve, reject) => {
        if (delay) {
            let intervalTimer;
            let TIMER_NOTIFICATION_ID = "timer";
            if (chrome.notifications.update) {
                let options = {
                    title: (delay / ONE_SECOND)
                        .toString(),
                    message: "",
                    type: "progress",
                    iconUrl: NOTIFICATION_ICON_URL,
                    progress: 100
                };
                chrome.notifications.create(TIMER_NOTIFICATION_ID, options, notificationId => {
                    if (chrome.runtime.lastError) {
                        console.error(chrome.runtime.lastError.message);
                    } else {
                        let secondCount = delay / ONE_SECOND;
                        intervalTimer = setInterval(() => {
                            secondCount--;
                            let progress = Math.round(secondCount / (delay / ONE_SECOND) * 100);
                            if (progress > 0) {
                                options.title = (secondCount)
                                    .toString();
                                options.progress = progress;
                                chrome.notifications.update(TIMER_NOTIFICATION_ID, options);
                            }
                        }, ONE_SECOND);
                    }
                });
            }
            setTimeout(() => {
                clearInterval(intervalTimer);
                chrome.notifications.clear(TIMER_NOTIFICATION_ID);
                resolve();
            }, delay);
        } else {
            resolve();
        }
    });
}

async function sleep(delay) {
    return new Promise(resolve => setTimeout(resolve, delay));
}

let chromeWindow;

window.onload = function(event) {
    const capture =  new URL(window.location.href).searchParams.get('capture');
    const url =  new URL(window.location.href).searchParams.get('url');

    if (capture === 'image') {
        grabScreen().then(function (screenShotData) {
            var capturaPantalla = {
                imagen: screenShotData,
                url: url || ''
            };
            localStorage['capturaPantalla'] = JSON.stringify(capturaPantalla);
            chrome.tabs.create({url: 'cropScreen.html'});
            chrome.windows.remove(chromeWindow.id);
        });
    } else {
        recordScreen().then(function () {
            localStorage['capturaVideo'] = screenShotData;
            chrome.tabs.create({url: 'captureVideo.html'});
            chrome.windows.remove(chromeWindow.id);
        });
    }
};

