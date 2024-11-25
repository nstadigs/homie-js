export const WEBOS_LIVE_TV_APP_ID = "com.webos.app.livetv";
export const WEBOS_YOUTUBE_APP_ID = "youtube.leanback.v4";
export const WEBOS_NETFLIX_APP_ID = "netflix";
export const WEBOS_AMAZON_APP_ID = "amazon";
export const WEBOS_AIRPLAY_APP_ID = "airplay";
export const WEBOS_FACTORY_SETUP_APP_ID = "com.webos.app.factorywin";

// TV action export constants
export const webosUris = {
  TURN_OFF: "ssap://system/turnOff", // params: -
  SET_VOLUME: "ssap://audio/setVolume", // params: volumeLevel
  SET_MUTE: "ssap://audio/setMute", // params: mute
  VOLUME_UP: "ssap://audio/volumeUp", // params: -
  VOLUME_DOWN: "ssap://audio/volumeDown", // params: -
  CHANGE_SOUND_OUTPUT: "ssap://audio/changeSoundOutput", // params: output
  OPEN_CHANNEL: "ssap://tv/openChannel", // params: output
  CHANNEL_UP: "ssap://tv/channelUp", // params: -
  CHANNEL_DOWN: "ssap://tv/channelDown", // params: -
  SWITCH_INPUT: "ssap://tv/switchInput", // params: inputId
  TURN_OFF_SCREEN: "ssap://com.webos.service.tv.power/turnOffScreen", // params: standbyMode (active or passive[passive cannot turn screen back on])
  TURN_ON_SCREEN: "ssap://com.webos.service.tv.power/turnOnScreen", // params: standbyMode (active or passive[passive cannot turn screen back on])
  TURN_OFF_SCREEN_ALT: "ssap://com.webos.service.tvpower/power/turnOffScreen", // alternative version, probably for webOS5+ TVs, accepts the same params as above
  TURN_ON_SCREEN_ALT: "ssap://com.webos.service.tvpower/power/turnOnScreen", // alternative version, probably for webOS5+ TVs, accepts the same params as above
  LAUNCH_APP: "ssap://com.webos.applicationManager/launch", // params: id, params
  OPEN_APP: "ssap://com.webos.applicationManager/open", // params: id
  CLOSE_APP: "ssap://com.webos.applicationManager/close", // params: id
  PLAY: "ssap://media.controls/play", // params: -
  PAUSE: "ssap://media.controls/pause", // params: -
  STOP: "ssap://media.controls/stop", // params: -
  REWIND: "ssap://media.controls/rewind", // params: -
  FAST_FORWARD: "ssap://media.controls/fastForward", // params: -
  CREATE_TOAST: "ssap://system.notifications/createToast", // params: message, iconData, iconExtension, onClick[appId, params]
  CLOSE_TOAST: "ssap://system.notifications/closeToast", // params: toastId
  CREATE_ALERT: "ssap://system.notifications/createAlert", // params: title, message, modal, buttons, onclose[uri, params], type,isSysReq || buttons - label, focus, buttonType, onClick [luna uri], params
  CLOSE_ALERT: "ssap://system.notifications/closeAlert", // params: alertId

  // TV information constants
  AUDIO_STATUS: "ssap://audio/getStatus",
  POWER_STATE: "ssap://com.webos.service.tvpower/power/getPowerState",
  SYSTEM_INFO: "ssap://system/getSystemInfo",
  SW_INFO: "ssap://com.webos.service.update/getCurrentSWInformation",
  SERVICE_LIST: "ssap://api/getServiceList",
  LAUNCH_POINTS: "ssap://com.webos.applicationManager/listLaunchPoints",
  LIST_APPS: "ssap://com.webos.applicationManager/listApps",
  EXTERNAL_INPUT_LIST: "ssap://tv/getExternalInputList",
  CHANNEL_LIST: "ssap://tv/getChannelList",
  FOREGROUND_APP_INFO:
    "ssap://com.webos.applicationManager/getForegroundAppInfo",
  CURRENT_CHANNEL: "ssap://tv/getCurrentChannel",
  SOUND_OUPUT: "ssap://com.webos.service.apiadapter/audio/getSoundOutput",
  SYSTEM_SETTINGS: "ssap://settings/getSystemSettings",

  // TV remote input socket constants
  REMOTE_POINTER_SOCKET_INPUT:
    "ssap://com.webos.service.networkinput/getPointerInputSocket",
};
// TV remote command list
export const REMOTE_COMMANDS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  "LIST",
  "AD",
  "DASH",
  "MUTE",
  "VOLUMEUP",
  "VOLUMEDOWN",
  "CHANNELUP",
  "CHANNELDOWN",
  "HOME",
  "MENU",
  "UP",
  "DOWN",
  "LEFT",
  "RIGHT",
  "CLICK",
  "BACK",
  "EXIT",
  "PROGRAM",
  "ENTER",
  "INFO",
  "RED",
  "GREEN",
  "YELLOW",
  "BLUE",
  "LIVE_ZOOM",
  "CC",
  "PLAY",
  "PAUSE",
  "REWIND",
  "FASTFORWARD",
  "POWER",
  "FAVORITES",
  "RECORD",
  "FLASHBACK",
  "QMENU",
  "GOTOPREV",
  "GOTONEXT",
  "3D_MODE",
  "SAP",
  "ASPECT_RATIO",
  "EJECT",
  "MYAPPS",
  "RECENT",
  "BS",
  "BS_NUM_1",
  "BS_NUM_2",
  "BS_NUM_3",
  "BS_NUM_4",
  "BS_NUM_5",
  "BS_NUM_6",
  "BS_NUM_7",
  "BS_NUM_8",
  "BS_NUM_9",
  "BS_NUM_10",
  "BS_NUM_11",
  "BS_NUM_12",
  "CS1",
  "CS1_NUM_1",
  "CS1_NUM_2",
  "CS1_NUM_3",
  "CS1_NUM_4",
  "CS1_NUM_5",
  "CS1_NUM_6",
  "CS1_NUM_7",
  "CS1_NUM_8",
  "CS1_NUM_9",
  "CS1_NUM_10",
  "CS1_NUM_11",
  "CS1_NUM_12",
  "CS2",
  "CS2_NUM_1",
  "CS2_NUM_2",
  "CS2_NUM_3",
  "CS2_NUM_4",
  "CS2_NUM_5",
  "CS2_NUM_6",
  "CS2_NUM_7",
  "CS2_NUM_8",
  "CS2_NUM_9",
  "CS2_NUM_10",
  "CS2_NUM_11",
  "CS2_NUM_12",
  "TER",
  "TER_NUM_1",
  "TER_NUM_2",
  "TER_NUM_3",
  "TER_NUM_4",
  "TER_NUM_5",
  "TER_NUM_6",
  "TER_NUM_7",
  "TER_NUM_8",
  "TER_NUM_9",
  "TER_NUM_10",
  "TER_NUM_11",
  "TER_NUM_12",
  "3DIGIT_INPUT",
  "BML_DATA",
  "JAPAN_DISPLAY",
  "TELETEXT",
  "TEXTOPTION",
  "MAGNIFIER_ZOOM",
  "SCREEN_REMOT",
];
