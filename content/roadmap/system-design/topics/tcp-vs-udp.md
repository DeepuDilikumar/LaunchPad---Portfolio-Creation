---
id: tcp-vs-udp
title: TCP vs UDP
section: communication
why_here: How data gets across the wire changes what can go wrong.
summary: "TCP gives ordered, reliable delivery with connection setup and congestion control. UDP just sends packets: faster, no guarantees. Most APIs use TCP; video calls, games and DNS often use UDP because late data is useless anyway."
key_tradeoff: Reliability versus latency.
questions:
  - text: You're building live cricket score updates and a video call feature. TCP or UDP for each, and why?
    weak_answer: UDP for speed, TCP for reliability.
    red_note: why does speed matter here?
    follow_ups:
      - type: technical
        text: A packet is lost on TCP. What happens to the packets behind it?
      - type: tradeoff
        text: For video, is a late frame better than a missing one?
      - type: failure
        text: Some office networks block UDP. What does your video call do then?
      - type: measurement
        text: Which numbers would you watch to judge call quality?
    strong_moves:
      - TCP waits for lost data and delivers in order; UDP sends and moves on.
      - "Ask whether late data is still useful: scores yes, video frames no."
      - Plan a fallback to TCP when UDP is blocked, and accept the higher latency.
    asked_in: Screening or HLD round · SDE-1/SDE-2 · often inside “design a video calling app”
  - text: Your chat app's messages arrive late on poor mobile networks even though bandwidth looks fine. What's happening?
    free: false
self_check:
  - Can you explain head-of-line blocking in TCP?
  - Can you name two systems that use UDP and say why?
reviewed: false
---
