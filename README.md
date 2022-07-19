# WebRTC CDN Client

[![npm version](https://badge.fury.io/js/%40asanrom%2Fwebrtc-cdn-client.svg)](https://badge.fury.io/js/%40asanrom%2Fwebrtc-cdn-client)

Javascript client for [webrtc-cdn](https://github.com/AgustinSRG/webrtc-cdn).

## Installation

If you are using a npm managed project use:

```
npm install @asanrom/webrtc-cdn-client
```

If you are using it in the browser, download the minified file from the [Releases](https://github.com/AgustinSRG/webrtc-cdn-client/tags) section and import it to your html:

```html
<script type="text/javascript" src="/path/to/webrtc-cdn-client.js"></script>
```

## Usage

```js
// Websocket connection URL
const wsURL = "ws://localhost/ws";

// RTC configuration
const rtcConfig = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ],
    "sdpSemantics": "unified-plan"
};

// Create a client to connect to WebRTC CDN
const client = new WebRTC_CDN.WebRTCClient(wsURL, rtcConfig);

client.on('open', () => {
    // Emitted when client connects to the WebRTC CDN node
    publishCamera(); // or playCamera()
});

client.on('close', () => {
    // Emitted when client connection close
    // You could reconnect or finish the session
});

client.on('error', e => {
    // Error messages such as connection errors
    console.error(e);
});

client.on('send', m => {
    // For debug purposes, you can log outgoing messages with the 'send' event
    console.log(">>> " + JSON.stringify(m));
});

client.on('message', m => {
    // For debug purposes, you can log incoming messages with the 'message' event
    console.log("<<< " + JSON.stringify(m));
});


function publishCamera() {
    navigator.mediaDevices.getUserMedia({video: true, audio: true}).then((stream) => {
        const req = client.publish(
            stream, // Media Stream to publish
            "camera", // Stream ID, needed also for other clients to play the stream
            "" // Authentication token (if required)
        );

        req.on('ok', () => {
            // Request success (after this, the publishing will start via WebRTC)
        });

        req.on('peer-connection-state-change', state => {
            // You can track the peer connection state with this event
            console.log("PeerConnection State: " + state);
        });

        req.on('error', e => {
            // Could not publish
            alert("Error: " + e.code + " / " + e.message);
        });

        req.on('close', () => {
            // Request closed
        });
    });
}

function playCamera() {
    const req = client.play(
        "camera", // Stream ID to play
        "" // Authentication token (if required)
    );

    req.on('ok', () => {
        // Request success (after this, the play will start via WebRTC)
    });

    req.on('standby', () => {
        // The stream is in STANDBY mode
        // This means there is no peer publishing yet
        // By default, the request will be waiting until a stream starts
        document.getElementById("test_video").pause();
        document.getElementById("test_video").srcObject = null;
    });

    req.on('stream', (mediaStream) => {
        // Received playable media stream
        // You may add it to some video element to show for the user
        document.getElementById("test_video").srcObject = mediaStream;
        document.getElementById("test_video").play();
    });

    req.on('peer-connection-state-change', state => {
        // You can track the peer connection state with this event
        console.log("PeerConnection State: " + state);
    });

    req.on('error', e => {
        // Could not play
        alert("Error: " + e.code + " / " + e.message);
    });

    req.on('close', () => {
        // Request closed
    });
}

```

## Documentation

 - [Library documentation (Auto-generated)](https://agustinsrg.github.io/webrtc-cdn-client/)
