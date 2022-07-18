// Request

"use strict";

import EventEmitter from "events";
import { WebRTCClient } from "./client";
import { getStreamType } from "./stream-util";

export declare interface WebRTCRequest {
    /**
     * Event triggered when OK message is received
     */
    addEventListener(event: 'ok', listener: () => void): this;

    /**
     * Event triggered when OK message is received
     */
    addEventListener(event: 'standby', listener: () => void): this;

    /**
     * Event triggered for PLAY requests, when OFFER is received
     */
    addEventListener(event: 'stream', listener: (stream: MediaStream) => void): this;

    /**
     * Event triggered for PLAY requests, when a track is received
     */
    addEventListener(event: 'track', listener: (track: MediaStreamTrack) => void): this;

    /**
     * Event triggered when the request is closed
     */
    addEventListener(event: 'close', listener: () => void): this;

    /**
     * Event triggered when ERROR message is received
     */
    addEventListener(event: 'error', listener: (error: { code: string, message: string }) => void): this;

    /**
     * Event triggered when peer connection states changes
     */
    addEventListener(event: 'peer-connection-state-change', listener: (state: RTCPeerConnectionState) => void): this;
}

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

    /**
     * @param client Client
     * @param id Request ID
     * @param type Request type
     * @param stream Stream to publish
     * @param streamId Stream ID
     * @param authToken Auth token to perform the request
     */
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

    /**
     * Starts the request
     */
    public start() {
        this.active = false;
        if (this.type === "PUBLISH") {
            this.startPublish();
        } else {
            this.startPlay();
        }
    }

    /**
     * Called when OK message is received
     */
    public ok() {
        this.active = true;
        this.emit("ok");
    }

    /**
     * Closes the request
     */
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

    /**
     * Called when request is closed
     */
    public onClose() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        this.active = false;
        this.emit("close");
    }

    /**
     * Called when ERROR message is received
     * @param code Error code
     * @param msg Error message
     */
    public onError(code: string, msg: string) {
        this.emit("error", { code: code, message: msg });
    }

    /**
     * Starts PLAY request
     */
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

    /**
     * Starts PUBLISH request
     */
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

    /**
     * Called when OFFER message is received
     * @param offer WebRTC offer
     */
    public onOffer(offer: RTCSessionDescriptionInit) {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }

        this.peerConnection = new RTCPeerConnection(this.client.config);

        if (this.type === "PLAY") {
            this.stream = new MediaStream();
            this.emit("stream", this.stream);

            this.peerConnection.ontrack = ev => {
                this.emit("track", ev.track);
                if (this.stream) {
                    this.stream.addTrack(ev.track);
                }
            };
        }

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

        this.peerConnection.setRemoteDescription(offer).then(() => {
            if (this.type === "PUBLISH") {
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

    /**
     * Called on CANDIDATE message
     * @param candidate ICE candidate
     */
    public onCandidate(candidate: RTCIceCandidateInit) {
        if (this.peerConnection) {
            this.peerConnection.addIceCandidate(candidate)
        }
    }

    /**
     * Called on STANDBY message
     */
    public onStandby() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
        this.emit("standby");
    }
}
