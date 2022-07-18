// Request

"use strict";

import EventEmitter from "events";
import { WebRTCClient } from "./client";

/**
 * WebRTC client request
 */
export class WebRTCRequest extends EventEmitter {
    public client: WebRTCClient;
    
}
