(function() {
    window.agora = new cc.EventTarget();
    agora.startTime = null;

    if ((typeof AgoraRTC) !== "undefined") {
        if (!AgoraRTC.checkSystemRequirements()) {
            alert("Your browser does not support WebRTC!");
        }

        if (agora.client == null) agora.client = AgoraRTC.createClient({
            mode: "rtc",
            codec: "vp8"
        });

        agora.printLog = function(key, source) {
            console.log("%c%s %c%s ", "background: #222222; color: #FF8800;", "[Received]", "background: #222222; color: #F5F5F5;", key);
            // console.log("[Received] " + key);
            if (source !== null) {
                console.log(source);
            }
        }

        agora.init = function(appid) {
            // initialize an array to manage remote streams
            // local stream is accessed via agora.stream
            agora.remoteStreams = [];

            agora.client.init(appid, function() {
                agora.client.on("first-audio-frame-decode", function(evt) {
                    agora.printLog("first-audio-frame-decode", evt);
                    agora.emit("first-audio-frame-decode", evt.stream.getId());
                });
                agora.client.on("stream-published", function(evt) {
                    agora.printLog("stream-published", evt);
                    agora.stream.play("Cocos2dGameContainer", {}, function(errState) {
                        console.log(errState);
                    });
                    agora.emit("local-stream-published-and-played");
                });
                agora.client.on("stream-added", function(evt) {
                    agora.printLog("stream-added", evt);
                    var stream = evt.stream;
                    agora.client.subscribe(stream, function(err) {
                        agora.emit("error", err, "Subscribe stream failed");
                    });
                });
                agora.client.on("stream-subscribed", function(evt) {
                    agora.printLog("stream-subscribed", evt);
                    var remoteStream = evt.stream;
                    agora.remoteStreams.push(remoteStream);
                    remoteStream.play("Cocos2dGameContainer", {}, function(errState) {
                        console.log(errState);
                    });
                    agora.emit("remote-stream-subscribed-and-played", evt.stream.getId());
                })
                agora.client.on("stream-removed", function(evt) {
                    agora.printLog("stream-removed", evt);
                    var stream = evt.stream;
                    stream.stop();
                    agora.remoteStreams = agora.remoteStreams.filter(function(item) {
                        return item.getId() !== stream.getId();
                    })
                });
                agora.client.on("peer-online", function(evt) {
                    agora.printLog("peer-online", evt);
                    agora.emit("peer-online", evt.uid, null);
                });
                agora.client.on("peer-leave", function(evt) {
                    agora.printLog("peer-leave", evt);
                    agora.emit("peer-leave", evt.uid, null);
                });
                agora.client.on("mute-audio", function(evt) {
                    agora.printLog("mute-audio", evt);
                    agora.emit("mute-audio", evt.uid, true);
                });
                agora.client.on("unmute-audio", function(evt) {
                    agora.printLog("unmute-audio", evt);
                    agora.emit("mute-audio", evt.uid, false);
                });
                agora.client.on("volume-indicator", function(evt) {
                    //agora.printLog("volume-indicator", evt);
                    var speakers = [];
                    var sumVolume = 0;
                    evt.attr.forEach(function(volume, index) {
                        speakers.push({
                            uid: volume.uid,
                            volume: volume.level
                        });
                        sumVolume += volume.level;
                    });
                    agora.emit("volume-indicator", speakers, speakers.length, sumVolume / speakers.length);
                });
                agora.client.on("error", err => {
                    agora.emit("error", err, err.reason);
                });

                // ======
                // 以下未使用
                // ======
                agora.client.on("client-banned", function(evt) {
                    agora.printLog("client-banned", evt);
                });
                agora.client.on("recording-device-changed", function(evt) {
                    agora.printLog("recording-device-changed", evt);
                });
                agora.client.on("onTokenPrivilegeWillExpire", function() {
                    agora.printLog("onTokenPrivilegeWillExpire", evt);
                });
                agora.client.on("client-role-changed", function(evt) {
                    agora.printLog("client-role-changed", evt);
                });

                agora.emit("init-success");

            }, err => {
                agora.emit("error", err, "client init failed!");
            });
        };

        agora.joinChannel = function(token, channelId, info, uid) {
            agora.client.join(token, channelId, uid, function(uid) {
                if (agora.stream == null) agora.stream = AgoraRTC.createStream({
                    streamID: uid,
                    audio: true,
                    video: false,
                    screen: false
                });

                agora.stream.init(function() {
                    console.log("Stream Initiated");
                    agora.client.publish(agora.stream, function(err) {
                        console.error("Publish local stream error");
                        console.error(err);
                    });
                }, function(err) {
                    console.error("getUserMedia failed");
                    console.error(err);
                });

                agora.emit("join-channel-success", channelId, uid, null);
            }, err => {
                agora.emit("error", err, "join channel failed!");
            });
        };

        agora.leaveChannel = function() {
            agora.client.unpublish(agora.stream, function(err) {
                console.err("Unpublish local stream error");
                console.err(err);
            });

            agora.client.leave(function() {
                agora.stream.stop();
                agora.stream.close();
                agora.stream = null;
                agora.remoteStreams.length = 0;
                agora.emit("leave-channel-success", null);
            }, err => {
                agora.emit("error", err, "leave channel failed!");
            })
        };

        agora.muteLocalAudioStream = function(mute) {
            mute ? agora.stream.muteAudio() : agora.stream.unmuteAudio();
        };

        agora.muteAllRemoteAudioStreams = function(mute) {
            agora.remoteStreams.forEach(function(stream) {
                mute ? stream.muteAudio() : stream.unmuteAudio();
            })
        };

        agora.muteRemoteAudioStream = function(uid, mute) {
            agora.remoteStreams.forEach(function(stream) {
                if (uid === stream.getId()) {
                    mute ? stream.muteAudio() : stream.unmuteAudio();
                }
            })
        };

        agora.enableAudioVolumeIndication = function (interval, smooth) {
            agora.client.enableAudioVolumeIndicator();
        };

        agora.getVersion = function() {
            return AgoraRTC.VERSION;
        };
    }

})();