// ################ お好みに合わせて変更してください ################

let triggerKey = "q";  // Jog/Shuttle/Variable操作に切り替えるキー
                       // Default: "q"

const mgn = 17;        // 大きくするとJogに入りやすくなりますが、
                       // Shuttle/Variableに入りづらくなります。
                       // Default: 17
                       
const shtlSpeed = 8;   // Shuttleの最大速度
                       // shtlSpeed[倍速]
                       // Default: 8

// ###############################################################


const PLAYMODE = {
    PAUSE: 0, PLAY: 1, JOGFWD: 2, JOGREV: 3,
    SHTLFWD: 4, SHTLREV: 5, VARFWD: 6, VARREV: 7,
    CLIPIN: 8, CLIPOUT: 9
};

const DIR8 = {
    NEUTRAL: 0, UP: 2, DOWN: 6, RIGHT: 4, LEFT: 8,
    UPRIGHT: 3, UPLEFT: 1, DOWNRIGHT: 5, DOWNLEFT: 7
};

const fps = 30;
let speed = 0;

// Global var
let videos;
videos = document.getElementsByTagName("video");
let video = videos[0];
let timer = 0;
let intervalMillis = 100;
let currentX = 0;
let currentY = 0;
let pastX = 0;
let pastY = 0;
let dir = 0;
let startIgnoreCnt = 0;
let playMode = PLAYMODE.PAUSE;
let playModePast = PLAYMODE.PAUSE;
let dirQue = [];
let cursorX = 0;
let cursorY = 0;
let isTouched = false;
let CtrlMode = false;


// let triggerSelector = document.getElementById("select-trigger");
// const triggerList = document.getElementsByName("option");
// triggerSelector.addEventListener("change", (e) => {
//     let idx = triggerSelector.selectedIndex;
//     triggerKey = triggerList[idx].value;
// });

// chrome.runtime.sendMessage('get-user-data', (response) => {
//     // 3. Got an asynchronous response with the data from the background
//     console.log('received user data', response);
//     initializeUI(response);
// });

// chrome.tabs.onMessage.addListener(function (message, sender, sendResponse) {
//     console.log(message);
//     return true;
// });

function playTime(time) {
    let hms = '';
    const t = Math.floor(time);
    const h = t / 3600 | 0;
    const m = t % 3600 / 60 | 0;
    const s = t % 60;
    const z2 = (v) => {
        const s = '00' + v
        return s.substr(s.length - 2, 2);
    }
    if (h != 0) {
        hms = h + ':' + z2(m) + ':' + z2(s);
    } else if (m != 0) {
        hms = z2(m) + ':' + z2(s);
    } else {
        hms = '00:' + z2(s);
    }
    hms += (":" + time.toFixed(2).substr(-2, 2));
    // hms += (":" + (Math.floor(parseFloat("0."+(String(time)).split(".")[1]) * 30)));
    // const frame = Math.floor((time - Math.floor(time)) * 30);
    // hms += (":" + ("00" + frame).slice(-2));
    return hms;
}

document.addEventListener("keydown", event => {
    if (event.key == triggerKey) {
        video.pause();
        if (!document.getElementById("screenLock")) {
            var element = document.createElement('div');
            element.id = "screenLock";
            element.style.height = '100%';
            element.style.left = '0px';
            element.style.position = 'fixed';
            element.style.top = '0px';
            element.style.width = '100%';
            element.style.zIndex = '9999';
            element.style.opacity = '0.2';
            element.style.backgroundColor = "rgba(0, 0, 0, 0.2)";

            let timecode = document.createElement("span");
            let timecodecontent = document.createTextNode(playTime(video.currentTime));
            timecode.id = "timecode";
            timecode.appendChild(timecodecontent);
            timecode.style.fontSize = "100px";
            timecode.style.color = "rgba(255, 255, 255, 1)";
            timecode.style.backgroundColor = "rgba(0, 0, 0, 1)";
            timecode.style.userSelect = "none";
            element.appendChild(timecode);

            let brelement = document.createElement("br");
            element.appendChild(brelement);

            let jogmode = document.createElement("span");
            let jogmodecontent = document.createTextNode("");
            jogmode.id = "jogmode";
            jogmode.appendChild(jogmodecontent);
            jogmode.style.fontSize = "100px";
            jogmode.style.color = "rgba(255, 255, 255, 1)";
            jogmode.style.backgroundColor = "rgba(0, 0, 0, 1)";
            jogmode.style.userSelect = "none";
            element.appendChild(jogmode);

            let brelement2 = document.createElement("br");
            element.appendChild(brelement2);

            let playspeed = document.createElement("span");
            let playspeedcontent = document.createTextNode("");
            playspeed.id = "playspeed";
            playspeed.appendChild(playspeedcontent);
            playspeed.style.fontSize = "100px";
            playspeed.style.color = "rgba(255, 255, 255, 1)";
            playspeed.style.backgroundColor = "rgba(0, 0, 0, 1)";
            playspeed.style.userSelect = "none";
            element.appendChild(playspeed);

            let objBody = document.getElementsByTagName("body").item(0);
            objBody.appendChild(element);

            CtrlMode = true;
        }
    }
});

document.addEventListener("keyup", event => {
    if (event.key == "q") {
        if (document.getElementById("screenLock")) {
            let element = document.createElement('div');
            let dom_obj = document.getElementById("screenLock");
            dom_obj.remove();
            CtrlMode = false;
        }
    }
});

video.addEventListener("timeupdate", (e) => {
    if (document.getElementById("timecode")) {
        document.getElementById("timecode").innerHTML = playTime(video.currentTime);
    }
    if (document.getElementById("jogmode") && document.getElementById("playspeed")) {
        let jogmodecontentstr = "";
        let speedcontentstr = "";
        if (playMode == PLAYMODE.JOGFWD || playMode == PLAYMODE.JOGREV) {
            jogmodecontentstr = "JOG";
            speedcontentstr = "";
        } else if (playMode == PLAYMODE.VARFWD || playMode == PLAYMODE.VARREV) {
            jogmodecontentstr = "VARIABLE";
            speedcontentstr = "x" + speed.toFixed(3);
        } else if (playMode == PLAYMODE.SHTLFWD || playMode == PLAYMODE.SHTLREV) {
            jogmodecontentstr = "SHUTTLE";
            speedcontentstr = "x" + speed.toFixed(3);
        }
        document.getElementById("jogmode").innerHTML = jogmodecontentstr;
        document.getElementById("playspeed").innerHTML = speedcontentstr;
    }
    console.log(triggerKey);
});


function main() {
    timer += intervalMillis;

    if (CtrlMode) {
        currentX = cursorX;
        currentY = cursorY;

        // 角度計算
        let degree = Math.atan2(currentY - pastY, currentX - pastX) * 180 / Math.PI;


        // angle to dir
        if (startIgnoreCnt++ > 1) {
            if ((!isTouched) || ((currentX == pastX) && (currentY == pastY))) dir = 0;
            else {
                if (-157.5 - mgn < degree && degree <= -112.5 + mgn) dir = DIR8.UPLEFT;
                else if (-112.5 + mgn < degree && degree <= -67.5 - mgn) dir = DIR8.UP;
                else if (-67.5 - mgn < degree && degree <= -22.5 + mgn) dir = DIR8.UPRIGHT;
                else if (-22.5 + mgn < degree && degree <= 22.5 - mgn) dir = DIR8.RIGHT;
                else if (22.5 - mgn < degree && degree <= 67.5 + mgn) dir = DIR8.DOWNRIGHT;
                else if (67.5 + mgn < degree && degree <= 112.5 - mgn) dir = DIR8.DOWN;
                else if (112.5 - mgn < degree && degree <= 157.5 + mgn) dir = DIR8.DOWNLEFT;
                else if (157.5 + mgn < degree || degree <= -157.5 - mgn) dir = DIR8.LEFT;
            }

            if (isTouched) {
                if (dirQue.length >= 10) {
                    dirQue.pop();
                }
                dirQue.unshift(dir);
            }

        }

        // ############ mode判定 ############
        let skipframe = 0;
        if (dirQue.length >= 2) {
            let dirSub = dirQue[0] - dirQue[1];
            switch (playMode) {
                case PLAYMODE.JOGFWD:
                    if ((currentX != pastX) || (currentY != pastY)) {
                        video.currentTime += 1 / fps;
                    }
                    break;

                case PLAYMODE.JOGREV:
                    if ((currentX != pastX) || (currentY != pastY)) {
                        video.currentTime -= 1 / fps;
                    }
                    break;

                case PLAYMODE.SHTLFWD:
                case PLAYMODE.VARFWD:
                    if (currentX < window.innerWidth / 2) {
                        speed = currentX / window.innerWidth * 2;
                        video.currentTime += speed / (1000 / intervalMillis);
                        playMode = PLAYMODE.VARFWD;
                    } else {
                        speed = (currentX / window.innerWidth - 0.5) * 2 * (shtlSpeed - 1) + 1;
                        video.currentTime += speed / (1000 / intervalMillis);
                        playMode = PLAYMODE.SHTLFWD;
                    }
                    break;

                case PLAYMODE.SHTLREV:
                case PLAYMODE.VARREV:
                    if (currentX > window.innerWidth / 2) {
                        speed = (window.innerWidth - currentX) / window.innerWidth * 2;
                        video.currentTime -= speed / (1000 / intervalMillis);
                        playMode = PLAYMODE.VARREV;
                    } else {
                        speed = ((window.innerWidth - currentX) / window.innerWidth - 0.5) * 2 * (shtlSpeed - 1) + 1;
                        video.currentTime -= speed / (1000 / intervalMillis);
                        playMode = PLAYMODE.SHTLREV;
                    }
                    break;

                default:
                    if (((1 <= dirSub) && (dirSub <= 2)) || ((-7 <= dirSub) && (dirSub <= -6))) {
                        video.currentTime += 1 / 30;
                        playMode = PLAYMODE.JOGFWD;
                    }
                    else if (((-1 <= dirSub) && (dirSub <= -2)) || ((6 <= dirSub) && (dirSub <= 7))) {
                        video.currentTime -= 1 / 30;
                        playMode = PLAYMODE.JOGREV;
                    }
                    else {
                        if ((dirQue[0] == 4) && (dirQue[1] == 4)) {
                            if (currentX < window.innerWidth / 2) {
                                speed = currentX / window.innerWidth * 2;
                                video.currentTime += speed / (1000 / intervalMillis);
                                playMode = PLAYMODE.VARFWD;
                            } else {
                                speed = (currentX / window.innerWidth - 0.5) * 2 * (shtlSpeed - 1) + 1;
                                video.currentTime += speed / (1000 / intervalMillis);
                                playMode = PLAYMODE.SHTLFWD;
                            }
                            break;

                        }
                        else if ((dirQue[0] == 8) && (dirQue[1] == 8)) {
                            if (currentX > window.innerWidth / 2) {
                                speed = (window.innerWidth - currentX) / window.innerWidth * 2;
                                video.currentTime -= speed / (1000 / intervalMillis);
                                playMode = PLAYMODE.VARREV;
                            } else {
                                speed = ((window.innerWidth - currentX) / window.innerWidth - 0.5) * 2 * (shtlSpeed - 1) + 1;
                                video.currentTime -= speed / (1000 / intervalMillis);
                                playMode = PLAYMODE.SHTLREV;
                            }
                            break;
                        }
                        else if ((dirQue[0] == 2) && (dirQue[1] == 2)) {

                            playMode = PLAYMODE.CLIPOUT;
                        }
                        else if ((dirQue[0] == 6) && (dirQue[1] == 6)) {
                            playMode = PLAYMODE.CLIPIN;
                        }
                    }
                    break;
            }
        }

        pastX = currentX;
        pastY = currentY;
    }

}

function init_video() {

    document.addEventListener("mousedown", (e) => {
        isTouched = true;
        startIgnoreCnt = 0;
    });

    document.addEventListener("mouseup", (e) => {
        isTouched = false;
        playMode = PLAYMODE.PAUSE;
        dirQue = [];
    });

    document.addEventListener("mousemove", (e) => {
        cursorX = e.clientX;
        cursorY = e.clientY;
    });

    isTouched = false;
    playMode = PLAYMODE.PAUSE;
    dirQue = [];
}

init_video();
setInterval(main, intervalMillis);