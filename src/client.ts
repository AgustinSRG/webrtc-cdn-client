// Client

"use strict";

import EventEmitter from "events";

/**
 * WebRTC CDN Client
 */
export class WebRTCClient extends EventEmitter {
    public url: string;
    public ws: WebSocket;

    /**
     * @param url Websocket url
     */
    constructor(url: string) {
        super();
        this.url = url;
        document.addEventListener
    }

    
}
