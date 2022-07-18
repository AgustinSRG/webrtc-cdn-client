// Client

"use strict";

import EventEmitter from "events";
import { makeMessage, parseMessage, SignalingMessage } from "./message";
import { WebRTCRequest } from "./request";

/**
 * WebRTC CDN Client
 */
export class WebRTCClient extends EventEmitter {
    public url: string;
    public ws: WebSocket;

    public config: RTCConfiguration;

    public requests: Map<string, WebRTCRequest>;

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

    public close() {
        if (this.ws) {
            this.ws.close();
        }
    }

    public send(msg: SignalingMessage) {
        this.emit("send", msg);
        if (this.ws) {
            this.ws.send(makeMessage(msg));
        }
    }

    private onOpen() {
        this.emit("connect");
    }

    private onClose(ev: CloseEvent) {
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
}
