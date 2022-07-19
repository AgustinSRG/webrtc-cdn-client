// Client

"use strict";

import EventEmitter from "events";
import { makeMessage, parseMessage, SignalingMessage } from "./message";
import { WebRTCRequest } from "./request";
import { detectStreamEnding } from "./stream-util";

export declare interface WebRTCClient {
    /**
     * Event triggered when connection is established
     */
    addEventListener(event: 'open', listener: () => void): this;

    /**
     * Event triggered when connection is closed
     */
    addEventListener(event: 'close', listener: (ev: CloseEvent) => void): this;

    /**
     * Event triggered when error occurs
     */
    addEventListener(event: 'error', listener: (error: Error) => void): this;

    /**
     * Event triggered when message is received
     */
    addEventListener(event: 'message', listener: (msg: SignalingMessage) => void): this;
}

/**
 * WebRTC CDN Client
 */
export class WebRTCClient extends EventEmitter {
    public url: string;
    public ws: WebSocket;

    public config: RTCConfiguration;

    public requests: Map<string, WebRTCRequest>;

    private heartbeatInterval: NodeJS.Timeout;

    /**
     * @param url Websocket url
     * @param config WebRTc configuration
     */
    constructor(url: string, config: RTCConfiguration) {
        super();
        this.url = url;
        this.ws = null;
        this.config = config;
        this.requests = new Map();
        this.connect();
    }

    /**
     * Connects to WebRTC CDN
     */
    public connect() {
        if (this.ws) {
            return; // Already connected
        }
        this.ws = new WebSocket(this.url);
        this.ws.onopen = this.onOpen.bind(this);
        this.ws.onclose = this.onClose.bind(this);
        this.ws.onerror = this.onError.bind(this);
        this.ws.onmessage = this.onMessage.bind(this);
    }

    /**
     * Closes the connection
     */
    public close() {
        if (this.ws) {
            this.ws.close();
        }
    }

    /**
     * Sends a message
     * @param msg The message to send
     */
    public send(msg: SignalingMessage) {
        this.emit("send", msg);
        if (this.ws) {
            this.ws.send(makeMessage(msg));
        }
    }

    /**
     * Starts a PLAY request
     * @param requestID Request ID
     * @param streamId Stream ID
     * @param authToken Auth token
     * @returns The request
     */
    public play(requestID: string, streamId: string, authToken?: string): WebRTCRequest {
        const req = new WebRTCRequest(this, requestID, "PLAY", null, streamId, authToken || "");
        req.start();
        return req;
    }

    /**
     * Starts a PUBLISH request
     * @param requestID Request ID
     * @param stream Media stream
     * @param streamId Stream ID
     * @param authToken Auth token
     * @returns The request
     */
    public publish(requestID: string, stream: MediaStream, streamId: string, authToken?: string): WebRTCRequest {
        const req = new WebRTCRequest(this, requestID, "PUBLISH", stream, streamId, authToken || "");
        detectStreamEnding(stream, () => {
            req.close();
        });
        req.start();
        return req;
    }

    /* Private methods */

    private onOpen() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        this.heartbeatInterval = setInterval(this.sendHeartBeat.bind(this), 20000);
        this.emit("open");
    }

    private onClose(ev: CloseEvent) {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        this.ws = null;
        this.requests.forEach(r => {
            r.onClose();
        });
        this.requests.clear();
        this.emit("close", ev);
    }

    private onError(err: Error) {
        this.emit("error", err);
    }

    private onMessage(ev: MessageEvent) {
        const msg = parseMessage("" + ev.data);
        this.emit("message", msg);

        const requestID = msg.args['Request-ID'] + "";
        const request = this.requests.get(requestID);

        switch (msg.type) {
        case "OK":
            if (request) {
                request.ok();
            }
            break;
        case "ERROR":
            if (request) {
                request.onError(msg.args['Error-Code'], msg.args['Error-Message']);
                request.onClose();
                this.requests.delete(requestID);
            }
            break;
        case "OFFER":
            if (request) {
                request.onOffer(JSON.parse(msg.body));
            }
            break;
        case "CANDIDATE":
            if (request) {
                request.onCandidate(msg.body ? JSON.parse(msg.body) : null);
            }
            break;
        case "CLOSE":
            if (request) {
                request.onClose();
                this.requests.delete(requestID)
            }
            break;
        case "STANDBY":
            if (request) {
                request.onStandby();
            }
            break;
        }
    }

    private sendHeartBeat() {
        this.send({
            type: "HEARTBEAT",
            args: {},
            body: "",
        });
    }
}
