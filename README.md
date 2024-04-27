# cf-email-worker-transcribe-audio-attachments

Cloudflare Email Worker implementation that automatically transcribes speech in attached files using Cloudflare's Workers AI with [the whisper model](https://developers.cloudflare.com/workers-ai/models/whisper/).

## Why?

My mobile carrier allows me to set up my voicemail to send the recorded messages to email. This is already an upgrade over having to call my voicemail service (which doesn't support Virtual Voicemail, especially not on Android) but still, it got me thinking... Why should I have to listen to these when I could read them? Well, that's what this project is!
