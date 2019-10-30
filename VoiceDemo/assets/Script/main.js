cc.Class({
    extends: cc.Component,

    properties: {
        localSpriteOn: {
            default: null,
            type: cc.Sprite
        },

        localSpriteOff: {
            default: null,
            type: cc.Sprite
        },

        btnLocal: {
            default: null,
            type: cc.Button
        },

        btnRemote: {
            default: null,
            type: cc.Button
        },

        btnJoinChannel: {
            default: null,
            type: cc.Button
        },

        btnCreateChannel: {
            default: null,
            type: cc.Button
        },

        btnLeaveChannel: {
            default: null,
            type: cc.Button
        },

        remoteSpriteOn: {
            default: null,
            type: cc.Sprite
        },

        remoteSpriteOff: {
            default: null,
            type: cc.Sprite
        },

        ebCreateChannel: {
            default: null,
            type: cc.EditBox
        },

        ebJoinChannel: {
            default: null,
            type: cc.EditBox
        },

        lblUserID: {
            default: null,
            type: cc.Label
        },

        lblLivingChannel: {
            default: null,
            type: cc.Label
        },
        rtMembers: {
            default: null,
            type: cc.RichText
        },

    },

    ctor: function() {
        this.appID = "1c90b643b8294de0953ee2fbe9ebd859";
        this.tmpToken = "0061c90b643b8294de0953ee2fbe9ebd859IABawKRb1lddDABYzv2smd0f11VtMvngeOig4NbOmrxluuJ8ivcAAAAAEABqLS7leE66XQEAAQB3Trpd";
        this.userID = "";
        this.joined = false;
        this.muteRemote = false;
        this.muteLocal = false;
        this.mapMembers = new Map();
    },

    onLoad: function() {
        this.enableMediaDevices();

        // 初始化用戶名稱
        var dateTime = Date.now();
        var timestamp = Math.floor(dateTime / 1000);
        this.userID = timestamp;
        this.lblUserID.string = this.userID;

        this.btnLocal.interactable = false;
        this.btnRemote.interactable = false;
        this.btnLeaveChannel.interactable = false;
        this.btnCreateChannel.interactable = false;

        this.updateMute();
        this.initAgoraEvents();
        this.initAgora();
    },

    update: function() {
        this.rtMembers.string = "成員列表:<br />";
        for(var [key, value] of this.mapMembers) {
            var tmpString = key;
            if (value > 0) {
                tmpString += ": 說話中...";
            }

            this.rtMembers.string += tmpString + "<br />";
        }
    },

    onDestroy: function () {
        this.uninitAgoraEvents();
    },

    initAgoraEvents: function() {
        if (agora) {
            agora.on('join-channel-success', this.onJoinChannelSuccess, this);
            agora.on('audio-volume-indication', this.onAudioVolumeIndication, this);
            agora.on('error', this.onError, this);
            agora.on('leave-channel', this.onLeaveChannel, this);
            agora.on('user-joined', this.onUserJoined, this);
            agora.on('user-offline', this.onUserOffline, this);
            agora.on('user-mute-audio', this.onUserMuteAudio, this);
            agora.on('connection-interrupted', this.onConnectionInterrupted, this);
            agora.on('request-token', this.onRequestToken, this);
            agora.on('client-role-changed', this.onClientRoleChanged, this);
            agora.on('rejoin-channel-success', this.onRejoinChannelSuccess, this);
            agora.on('audio-quality', this.onAudioQuality, this);
            agora.on('warning', this.onWarning, this);
            agora.on('network-quality', this.onNetworkQuality, this);
            agora.on('audio-routing-changed', this.onAudioRoutingChanged, this);
            agora.on('connection-lost', this.onConnectionLost, this);
            agora.on('connection-banned', this.onConnectionBanned, this);
            agora.on('init-success', this.onInitSuccess, this);
            agora.on('recording-device-changed', this.onRecordingDeviceChanged, this);

            this.printLog("初始化 Agora 監聽事件");
        }
    },

    uninitAgoraEvents: function () {
        if (agora) {
            agora.off('join-channel-success', this.onJoinChannelSuccess);
            agora.off('leave-channel', this.onLeaveChannel);
            agora.off('rejoin-channel-success', this.onRejoinChannelSuccess, this);
            agora.off('warning', this.onWarning, this);
            agora.off('error', this.onError, this);
            agora.off('audio-quality', this.onAudioQuality, this);
            agora.off('audio-volume-indication', this.onAudioVolumeIndication, this);
            agora.off('network-quality', this.onNetworkQuality, this);
            agora.off('user-joined', this.onUserJoined, this);
            agora.off('user-offline', this.onUserOffline, this);
            agora.off('user-mute-audio', this.onUserMuteAudio, this);
            agora.off('audio-routing-changed', this.onAudioRoutingChanged, this);
            agora.off('connection-lost', this.onConnectionLost, this);
            agora.off('connection-interrupted', this.onConnectionInterrupted, this);
            agora.off('request-token', this.onRequestToken, this);
            agora.off('connection-banned', this.onConnectionBanned, this);
            agora.off('client-role-changed', this.onClientRoleChanged, this);
        }
    },

    enableMediaDevices: function() {
        this.printLog("Navigator Info:");
        console.log(navigator);

        var mediaPermission = false;
        switch (navigator.vendor) {
            case "Google Inc.":
                mediaPermission = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||  navigator.msGetUserMedia
                var self = this;
                if (mediaPermission) {
                    navigator.getUserMedia({audio:true}, function onSuccess(stream) {
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
                var self = this;
                if (mediaPermission) {
                    navigator.mediaDevices.getUserMedia({audio:true})
                    .then(function(stream) {
                        self.printLog("麥克風權限請求成功");
                        console.log(stream);
                    })
                    .catch(function(error) {
                        self.printLog("麥克風權限請求失敗");
                        console.log(error);
                    });
                } else {
                    this.printLog(navigator.vendor + ": 不支援 navigator.mediaDevices.getUserMedia");
                }
                break;
        }
    },

    initAgora: function() {
        agora.init(this.appID);

        this.printLog("初始化 Agora 引擎");
    },

    joinChannel: function() {
        if (this.joined) {
            this.leaveChannel();
            return;
        }

        var channel = this.ebJoinChannel.string;
        if (channel == "") {
            this.printLog("未輸入頻道名稱");
            return;
        }

        // agora.muteLocalAudioStream(this.muteLocal);
        // agora.muteAllRemoteAudioStreams(this.muteRemote);

        this.btnJoinChannel.interactable = false;
        this.lblLivingChannel.string = "搜尋頻道中...";

        agora.joinChannel(this.tmpToken, channel, "", this.userID);
    },

    leaveChannel: function() {
        if (!this.joined) {
            this.printLog("未加入頻道");
            return;
        }

        agora.muteLocalAudioStream(this.muteLocal);
        agora.muteAllRemoteAudioStreams(this.muteRemote);

        this.btnLeaveChannel.interactable = false;
        agora.leaveChannel();
    },

    updateMute: function() {
        this.localSpriteOff.node.active = this.muteLocal;
        this.localSpriteOn.node.active = !this.muteLocal;
        this.remoteSpriteOff.node.active = this.muteRemote;
        this.remoteSpriteOn.node.active = !this.muteRemote;
    },

    btnLocalStream: function() {
        this.muteLocal = !this.muteLocal;
        this.updateMute();
        agora.muteLocalAudioStream(this.muteLocal);
    },

    btnRemoteStream: function() {
        this.muteRemote = !this.muteRemote;
        this.updateMute();
        agora.muteAllRemoteAudioStreams(this.muteRemote);
    },

    // ======
    // Hook Event
    // ======

    printLog: function (info) {
        console.log("%c%s %c%s ", "background: #222222; color: #00FF00;", "[CocosInfo]", "background: #222222; color: #F5F5F5;", info);
        // console.log("[CocosInfo] " + info);
    },

    onJoinChannelSuccess: function (channel, uid, elapsed) {
        this.joined = true;
        this.btnLocal.interactable = true;
        this.btnRemote.interactable = true;
        this.btnLeaveChannel.interactable = true;
        this.lblLivingChannel.string = "目前頻道: " + channel;
        this.mapMembers.set(uid.toString(), Number);

        agora.muteLocalAudioStream(this.muteLocal);
        agora.muteAllRemoteAudioStreams(this.muteRemote);

        agora.enableAudioVolumeIndication(200, 3);

        this.printLog("Join channel success, channel: " + channel + " uid: " + uid + " elapsed: " + elapsed);
    },

    onLeaveChannel: function (stat) {
        this.joined = false;
        this.btnLocal.interactable = false;
        this.btnRemote.interactable = false;
        this.btnJoinChannel.interactable = true;
        this.lblLivingChannel.string = "目前沒有加入到任何頻道中";
        this.mapMembers.clear();

        this.printLog("onLeaveChannel, stat: " + stat);
    },

    onRejoinChannelSuccess: function (channel, uid, elapsed) {
        this.printLog("onRejoinChannelSuccess, channel: " + channel + " uid: " + uid + " elapsed: " + elapsed);
    },

    onWarning: function (warn, msg) {
        this.printLog("onWarning, warn: " + warn + " msg: " + msg);
    },

    onError: function (warn, msg) {
        this.printLog("onError, warn: " + warn + " msg: " + msg);
    },

    onAudioQuality: function (uid, quality, delay, lost) {
        this.printLog("onAudioQuality, uid: " + uid + " quality: " + quality + " delay: " + delay + " lost: " + lost);
    },

    onAudioVolumeIndication: function (speakers, speakerNumber, totalVolume) {
        for(var [key, value] of this.mapMembers) {
            this.mapMembers.set(key, 0);
        }

        if (speakerNumber <= 0) {
            return;
        } 

        this.printLog("onAudioVolumeIndication, speakerNumber: " + speakerNumber + ", totalVolume: " + totalVolume);
        for (var i = 0; i < speakerNumber; i++) {
            if (speakers[i].uid == 0) {
                this.printLog("onAudioVolumeIndication, Local Speaker volume: " + speakers[i].volume);
                return;
            } else {
                this.mapMembers.set(speakers[i].uid.toString(), speakers[i].volume);

                this.printLog("onAudioVolumeIndication, Remote Speaker: [" + i + "], uid: " + speakers[i].uid + ", volume: " + speakers[i].volume);
            }
        }
    },

    onNetworkQuality: function (uid, txQuality, rxQuality) {
        this.printLog("onNetworkQuality, uid: " + uid + " txQuality: " + txQuality + " rxQuality: " + rxQuality);
    },

    onUserJoined: function (uid, elapsed) {
        this.mapMembers.set(uid.toString(), Number);

        this.printLog("onUserJoined, uid: " + uid + " elapsed: " + elapsed);
    },

    onUserOffline: function (uid, reason) {
        this.mapMembers.delete(uid.toString());

        this.printLog("onUserOffline, uid: " + uid + " reason: " + reason);
    },

    onUserMuteAudio: function (uid, muted) {
        this.printLog("onUserMuteAudio, uid: " + uid + " muted: " + muted);
    },

    onAudioRoutingChanged: function (routing) {
        this.printLog("onAudioRoutingChanged, routing: " + routing);
    },

    onConnectionLost: function () {
        this.printLog("onConnectionLost");
    },

    onConnectionInterrupted: function () {
        this.printLog("onConnectionInterrupted");
    },

    onRequestToken: function () {
        this.printLog("onRequestToken");
    },

    onConnectionBanned: function () {
        this.printLog("onConnectionBanned");
    },

    onClientRoleChanged: function (oldRole, newRole) {
        this.printLog("onClientRoleChanged, oldRole: " + oldRole + ", newRole: " + newRole);
    },

    onInitSuccess: function() {
        this.printLog("onInitSuccess");
    },

    onRecordingDeviceChanged: function(state, device) {
        this.printLog("onRecordingDeviceChanged, state: " + state + " device: ");
        console.log(device);
    },
});