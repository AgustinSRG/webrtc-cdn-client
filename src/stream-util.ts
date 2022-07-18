// Media Stream utils

"use strict";

export function getStreamType(stream: MediaStream): string {
    const hasAudio = stream.getAudioTracks().length > 0;
    const hasVideo = stream.getVideoTracks().length > 0;
    if (hasAudio && hasVideo) {
        return "DUAL";
    } else if (hasVideo) {
        return "VIDEO";
    } else {
        return "AUDIO";
    }
}

export function detectStreamEnding(stream: MediaStream, handler: () => any) {
    const tracks = stream.getTracks();
    if (tracks.length > 0) {
        tracks[0].addEventListener("ended", handler);
    }
}
