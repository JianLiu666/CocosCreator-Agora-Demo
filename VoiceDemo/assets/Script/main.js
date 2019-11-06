cc.Class({
    extends: cc.Component,

    properties: {
        localSpriteOn: cc.Sprite,
        localSpriteOff: cc.Sprite,
        btnLocal: cc.Button,
        btnRemote: cc.Button,
        btnJoinChannel: cc.Button,
        btnCreateChannel: cc.Button,
        btnLeaveChannel: cc.Button,
        btnInitAgora: cc.Button,
        remoteSpriteOn: cc.Sprite,
        remoteSpriteOff: cc.Sprite,
        ebCreateChannel: cc.EditBox,
        ebJoinChannel: cc.EditBox,
        lblUserID: cc.Label,
        lblLivingChannel: cc.Label,
        rtMembers: cc.RichText,
    },

    ctor: function () {
        this.appID = "1c90b643b8294de0953ee2fbe9ebd859";
        this.tmpToken = "0061c90b643b8294de0953ee2fbe9ebd859IABh2nHyL71PMcd7q5lfwEFchnWysa8mc3CVPafUFISMTeJ8ivcAAAAAEACfZcRHNLbDXQEAAQA1tsNd";
        this.userID = "";
        this.joined = false;
        this.muteRemote = false;
        this.muteLocal = false;
        this.mapMembers = new Map();
    },

    onLoad: function () {
        // 初始化用戶名稱
        let dateTime = Date.now();
        this.userID = Math.floor(dateTime / 1000);
        this.lblUserID.string = this.userID;

        this.btnLocal.interactable = false;
        this.btnRemote.interactable = false;
        this.btnCreateChannel.interactable = false;
        this.btnJoinChannel.interactable = false;
        this.btnLeaveChannel.interactable = false;

        this.updateMute();
        this.enableMediaDevices();
    },

    update: function () {
        this.rtMembers.string = "成員列表:<br />";
        for (let [key, value] of this.mapMembers) {
            let tmpString = key;
            if (value > 0) {
                tmpString += ": 說話中...";
            }

            this.rtMembers.string += tmpString + "<br />";
        }
    },

    onDestroy: function () {
        this.uninitAgoraEvents();
    },

    // ======
    // initialization
    // ======

    enableMediaDevices: function () {
        this.printLog("Navigator Info:");
        console.log(navigator);

        let mediaPermission = false;
        let self = this;
        switch (navigator.vendor) {
            case "Google Inc.":
                mediaPermission = navigator.getUserMedia;
                if (mediaPermission) {
                    navigator.getUserMedia({audio: true}, function onSuccess(stream) {
                        self.printLog("麥克風權限請求成功");
                        console.log(stream);
                    }, function onError(error) {
                        self.printLog("麥克風權限請求失敗");
                        console.log(error);
                    });
                } else {
                    this.printLog(navigator.vendor + ": 不支援 navigator.getUserMedia");
                }
                break;

            case "Apple Computer, Inc.":
                mediaPermission = navigator.mediaDevices.getUserMedia;
                if (mediaPermission) {
                    navigator.mediaDevices.getUserMedia({audio: true})
                        .then(function (stream) {
                            self.printLog("麥克風權限請求成功");
                            console.log(stream);
                        })
                        .catch(function (error) {
                            self.printLog("麥克風權限請求失敗");
                            console.log(error);
                        });
                } else {
                    this.printLog(navigator.vendor + ": 不支援 navigator.mediaDevices.getUserMedia");
                }
                break;
        }
    },

    updateMute: function () {
        this.localSpriteOff.node.active = this.muteLocal;
        this.localSpriteOn.node.active = !this.muteLocal;
        this.remoteSpriteOff.node.active = this.muteRemote;
        this.remoteSpriteOn.node.active = !this.muteRemote;
    },

    initAgoraEvents: function () {
        if (agora) {
            agora.on("first-audio-frame-decode", this.onFirstAudioFrameDecode, this);
            agora.on("local-stream-published-and-played", this.onLocalStreamPublishedAndPlayed, this);
            agora.on("peer-online", this.onPeerOnline, this);
            agora.on("peer-leave", this.onPeerLeave, this);
            agora.on("mute-audio", this.onMuteAudio, this);
            agora.on("volume-indicator", this.onVolumeIndicator, this);
            agora.on("init-success", this.onInitSuccess, this);
            agora.on("join-channel-success", this.onJoinChannelSuccess, this);
            agora.on("leave-channel-success", this.onLeaveChannelSuccess, this);
            agora.on("warning", this.onWarning, this);
            agora.on("error", this.onError, this);

            this.printLog("初始化 Agora 監聽事件");
        }
    },

    uninitAgoraEvents: function () {
        if (agora) {
            agora.off("first-audio-frame-decode", this.onFirstAudioFrameDecode, this);
            agora.off("local-stream-published-and-played", this.onLocalStreamPublishedAndPlayed, this);
            agora.off("peer-online", this.onPeerOnline, this);
            agora.off("peer-leave", this.onPeerLeave, this);
            agora.off("mute-audio", this.onMuteAudio, this);
            agora.off("volume-indicator", this.onVolumeIndicator, this);
            agora.off("init-success", this.onInitSuccess, this);
            agora.off("join-channel-success", this.onJoinChannelSuccess, this);
            agora.off("leave-channel-success", this.onLeaveChannelSuccess, this);
            agora.off("warning", this.onWarning, this);
            agora.off("error", this.onError, this);
        }
    },

    printLog: function (info) {
        console.log("%c%s %c%s ", "background: #222222; color: #00FF00;", "[CocosInfo]", "background: #222222; color: #F5F5F5;", info);
        // console.log("[CocosInfo] " + info);
    },

    // ======
    // GUI Event
    // ======

    btnEventInitAgora: function () {
        this.initAgoraEvents();
        agora.init(this.appID);

        this.btnInitAgora.interactable = false;
        this.btnJoinChannel.interactable = true;

        this.printLog("初始化 Agora 引擎");
    },

    btnEventJoinChannel: function () {
        if (this.joined) {
            this.leaveChannel();
            return;
        }

        let channel = this.ebJoinChannel.string;
        if (channel === "") {
            this.printLog("未輸入頻道名稱");
            return;
        }

        this.btnJoinChannel.interactable = false;
        this.lblLivingChannel.string = "搜尋頻道中...";

        agora.joinChannel(this.tmpToken, channel, "", this.userID);
    },

    btnEventLeaveChannel: function () {
        if (!this.joined) {
            this.printLog("未加入頻道");
            return;
        }

        this.btnLeaveChannel.interactable = false;

        agora.enableAudioVolumeIndication(-1, 3);
        agora.leaveChannel();
    },

    btnEventLocalStream: function () {
        this.muteLocal = !this.muteLocal;
        this.updateMute();
        agora.muteLocalAudioStream(this.muteLocal);
    },

    btnEventRemoteStream: function () {
        this.muteRemote = !this.muteRemote;
        this.updateMute();
        agora.muteAllRemoteAudioStreams(this.muteRemote);
    },

    // ======
    // Hook Event
    // ======

    onFirstAudioFrameDecode: function (uid) {
        this.printLog("onFirstAudioFrameDecode, uid: " + uid);
    },

    onLocalStreamPublishedAndPlayed: function () {
        this.printLog("onLocalStreamPublishedAndPlayed");

        agora.muteLocalAudioStream(this.muteLocal);
    },

    onRemoteStreamSubscribedAndPlayed: function (uid) {
        this.printLog("onRemoteStreamSubscribedAndPlayed, uid: " + uid);

        agora.muteRemoteAudioStream(uid, this.muteRemote);
    },

    onPeerOnline: function (uid, elapsed) {
        this.mapMembers.set(uid.toString(), Number);

        this.printLog("onPeerOnline, uid: " + uid + " elapsed: " + elapsed);
    },

    onPeerLeave: function (uid, reason) {
        this.mapMembers.delete(uid.toString());

        this.printLog("onPeerLeave, uid: " + uid + " reason: " + reason);
    },

    onMuteAudio: function (uid, muted) {
        this.printLog("onMuteAudio, uid: " + uid + " muted: " + muted);
    },

    onVolumeIndicator: function (speakers, speakerNumber, totalVolume) {
        for (let [key, value] of this.mapMembers) {
            this.mapMembers.set(key, 0);
        }

        if (speakerNumber <= 0) {
            return;
        }

        this.printLog("onVolumeIndicator, speakerNumber: " + speakerNumber + ", totalVolume: " + totalVolume);
        for (let i = 0; i < speakerNumber; i++) {
            if (speakers[i].uid === 0) {
                this.printLog("onVolumeIndicator, Local Speaker volume: " + speakers[i].volume);
                return;
            } else {
                this.mapMembers.set(speakers[i].uid.toString(), speakers[i].volume);

                this.printLog("onVolumeIndicator, Remote Speaker: [" + i + "], uid: " + speakers[i].uid + ", volume: " + speakers[i].volume);
            }
        }
    },

    onInitSuccess: function () {
        this.printLog("onInitSuccess");
    },

    onJoinChannelSuccess: function (channel, uid, elapsed) {
        this.joined = true;
        this.btnLocal.interactable = true;
        this.btnRemote.interactable = true;
        this.btnLeaveChannel.interactable = true;
        this.lblLivingChannel.string = "目前頻道: " + channel;
        this.mapMembers.set(uid.toString(), Number);

        agora.enableAudioVolumeIndication(200, 3);

        this.printLog("Join channel success, channel: " + channel + " uid: " + uid + " elapsed: " + elapsed);
    },

    onLeaveChannelSuccess: function (stat) {
        this.joined = false;
        this.btnLocal.interactable = false;
        this.btnRemote.interactable = false;
        this.btnJoinChannel.interactable = true;
        this.lblLivingChannel.string = "尚未加入到任何頻道中";
        this.mapMembers.clear();

        this.printLog("onLeaveChannel, stat: " + stat);
    },

    onWarning: function (warn, msg) {
        this.printLog("onWarning, warn: " + warn + " msg: " + msg);
    },

    onError: function (warn, msg) {
        this.printLog("onError, warn: " + warn + " msg: " + msg);
    },
});