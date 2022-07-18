// Request

"use strict";

import EventEmitter from "events";
import { WebRTCClient } from "./client";
import { getStreamType } from "./stream-util";

/**
 * WebRTC client request
 */
export class WebRTCRequest extends EventEmitter {
    public client: WebRTCClient;

    public active: boolean;

    public id: string;

    public type: "PLAY" | "PUBLISH";

    public stream: MediaStream;

    public streamId: string;
    public authToken: string;

    public peerConnection: RTCPeerConnection;

    constructor(client: WebRTCClient, id: string, type: "PLAY" | "PUBLISH", stream: MediaStream, streamId: string, authToken: string) {
        super();
        this.client = client;
        this.id = id;
        this.type = type;
        this.stream = stream;
        this.streamId = streamId;
        this.authToken = authToken;
        this.peerConnection = null;
        this.active = false;
    }

    public start() {
        this.active = false;
        if (this.type === "PUBLISH") {
            this.startPublish();
        } else {
            this.startPlay();
        }
    }

    public ok() {
        this.active = true;
        this.emit("ok");
    }

    public close() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        this.client.send({
            type: "CLOSE",
            args: {
                "Request-ID": this.id,
            },
            body: "",
        });
        this.active = false;
    }

    public onClose() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        this.active = false;
        this.emit("close");
    }

    public onError(code: string, msg: string) {
        this.emit("error", { code: code, msg: msg });
    }

    public startPlay() {
        this.client.send({
            type: "PLAY",
            args: {
                "Request-ID": this.id,
                "Stream-ID": this.streamId,
                "Auth": this.authToken,
            },
            body: "",
        });
    }

    public startPublish() {
        this.client.send({
            type: "PUBLISH",
            args: {
                "Request-ID": this.id,
                "Stream-ID": this.streamId,
                "Stream-Type": getStreamType(this.stream),
                "Auth": this.authToken,
            },
            body: "",
        });
    }

    public onOffer(offer: RTCSessionDescriptionInit) {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        this.peerConnection = new RTCPeerConnection(this.client.config);

        this.peerConnection.onicecandidate = ev => {
            if (ev.candidate) {
                this.client.send({
                    type: "CANDIDATE",
                    args: {
                        "Request-ID": this.id,
                    },
                    body: JSON.stringify(ev.candidate),
                });
            } else {
                this.client.send({
                    type: "CANDIDATE",
                    args: {
                        "Request-ID": this.id,
                    },
                    body: "",
                });
            }
        }

        this.peerConnection.onconnectionstatechange = ev => {
            this.emit("peer-connection-state-change", this.peerConnection.connectionState);
        };

        this.peerConnection.ontrack = ev => {
            this.emit("track", ev.track);
        };

        this.peerConnection.setRemoteDescription(offer).then(() => {
            if (this.stream) {
                // Add tracks
                this.stream.getTracks().forEach(track => {
                    this.peerConnection.addTrack(track)
                });
            }

            this.peerConnection.createAnswer().then(answer => {
                this.peerConnection.setLocalDescription(answer).then(() => {

                    this.client.send({
                        type: "ANSWER",
                        args: {
                            "Request-ID": this.id,
                        },
                        body: JSON.stringify(answer),
                    });
                });
            })
        });
    }

    public onCandidate(candidate: RTCIceCandidateInit) {
        if (this.peerConnection) {
            this.peerConnection.addIceCandidate(candidate)
        }
    }

    public onStandby() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        this.emit("standby");
    }
}
