import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_MESSAGES, type SignalingMessage } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

type ConnectionState = 'IDLE' | 'SEARCHING' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export function useWebRTC() {
  const [status, setStatus] = useState<ConnectionState>('IDLE');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [messages, setMessages] = useState<{ id: string; text: string; sender: 'me' | 'stranger' }[]>([]);
  
  const ws = useRef<WebSocket | null>(null);
  const pendingJoin = useRef(false);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const { toast } = useToast();

  const cleanup = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      setRemoteStream(null);
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
  }, [localStream, remoteStream]);

  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use an environment variable for the signaling server URL if available, 
    // otherwise fallback to the current host
    const signalingServerUrl = import.meta.env.VITE_SIGNALING_SERVER_URL;
    const wsUrl = signalingServerUrl || `${protocol}//${window.location.host}/ws`;

    if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
      return;
    }

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WS Connected');
      if (pendingJoin.current) {
        ws.current?.send(JSON.stringify({ type: WS_MESSAGES.JOIN }));
        pendingJoin.current = false;
        setStatus('SEARCHING');
      }
    };

    ws.current.onmessage = async (event) => {
      try {
        const msg: SignalingMessage = JSON.parse(event.data);
        handleSignalingMessage(msg);
      } catch (err) {
        console.error('Failed to parse WS message', err);
      }
    };

    ws.current.onclose = () => {
      console.log('WS Closed');
      if (status !== 'IDLE') {
        setStatus('ERROR');
        toast({
          title: "Connection closed",
          description: "Signaling server closed the connection. Please try again.",
          variant: "destructive"
        });
      }
    };

    ws.current.onerror = () => {
      if (status !== 'IDLE') {
        setStatus('ERROR');
      }
      toast({
        title: "Connection error",
        description: "Unable to connect to the signaling server.",
        variant: "destructive"
      });
    };
  }, [status, toast]); // Dependencies will need to be managed carefully to avoid infinite loops

  // Initialize WebRTC Peer Connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: WS_MESSAGES.CANDIDATE,
          payload: event.candidate
        }));
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setStatus('SEARCHING'); // Or handle as error/disconnect
        toast({ title: "Disconnected", description: "Connection lost with stranger.", variant: "destructive" });
        // Optionally auto-search again
        findStranger();
      }
    };

    peerConnection.current = pc;
    return pc;
  }, [toast]);

  const handleSignalingMessage = async (msg: SignalingMessage) => {
    switch (msg.type) {
      case 'MATCH':
        setStatus('CONNECTING');
        const pc = createPeerConnection();
        
        // Get local audio
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setLocalStream(stream);
          stream.getTracks().forEach(track => pc.addTrack(track, stream));
          
          if (msg.payload.initiator) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            ws.current?.send(JSON.stringify({ type: WS_MESSAGES.OFFER, payload: offer }));
          }
        } catch (err) {
          console.error("Error accessing media devices:", err);
          toast({ title: "Microphone Error", description: "Could not access microphone.", variant: "destructive" });
          setStatus('IDLE');
        }
        break;

      case 'OFFER':
        if (!peerConnection.current) return;
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(msg.payload));
        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);
        ws.current?.send(JSON.stringify({ type: WS_MESSAGES.ANSWER, payload: answer }));
        setStatus('CONNECTED');
        break;

      case 'ANSWER':
        if (!peerConnection.current) return;
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(msg.payload));
        setStatus('CONNECTED');
        break;

      case 'CANDIDATE':
        if (!peerConnection.current) return;
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(msg.payload));
        break;

      case 'PEER_LEFT':
        toast({ title: "Stranger Left", description: "Searching for a new partner..." });
        cleanup();
        setStatus('SEARCHING');
        ws.current?.send(JSON.stringify({ type: WS_MESSAGES.JOIN }));
        setMessages([]); // Clear chat on new connection
        break;

      case 'CHAT':
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          text: msg.payload.message, 
          sender: 'stranger' 
        }]);
        break;
        
      case 'ERROR':
        toast({ title: "Error", description: msg.payload.message, variant: "destructive" });
        setStatus('IDLE');
        break;
    }
  };

  const findStranger = () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      pendingJoin.current = true;
      connectWebSocket();
      setStatus('SEARCHING');
    } else {
      ws.current.send(JSON.stringify({ type: WS_MESSAGES.JOIN }));
      setStatus('SEARCHING');
    }
    setMessages([]);
  };

  const leaveChat = () => {
    ws.current?.send(JSON.stringify({ type: WS_MESSAGES.LEAVE }));
    cleanup();
    setStatus('IDLE');
    setMessages([]);
  };

  const skipStranger = () => {
    // Leave current, then immediately join new
    ws.current?.send(JSON.stringify({ type: WS_MESSAGES.LEAVE }));
    cleanup();
    setMessages([]);
    setStatus('SEARCHING');
    
    // Small delay to allow server to process leave
    setTimeout(() => {
       if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: WS_MESSAGES.JOIN }));
       }
    }, 200);
  };

  const sendMessage = (text: string) => {
    if (status === 'CONNECTED' && ws.current) {
      ws.current.send(JSON.stringify({ 
        type: WS_MESSAGES.CHAT, 
        payload: { message: text, timestamp: Date.now() } 
      }));
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        text, 
        sender: 'me' 
      }]);
    }
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      ws.current?.close();
      cleanup();
    };
  }, []);

  return {
    status,
    remoteStream,
    messages,
    findStranger,
    leaveChat,
    skipStranger,
    sendMessage
  };
}
