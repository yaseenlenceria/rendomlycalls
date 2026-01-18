import { useWebRTC } from "@/hooks/use-webrtc";
import { Button } from "@/components/ui/button";
import { AudioVisualizer } from "@/components/AudioVisualizer";
import { ChatBox } from "@/components/ChatBox";
import { ReportModal } from "@/components/ReportModal";
import { Mic, MicOff, SkipForward, PhoneOff, Radio } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const {
    status,
    remoteStream,
    messages,
    findStranger,
    leaveChat,
    skipStranger,
    sendMessage
  } = useWebRTC();

  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    // Note: In a real app we would access the local stream tracks here
    // For this UI implementation, we toggle state
    setIsMuted(!isMuted);
  };

  const isConnected = status === 'CONNECTED';
  const isSearching = status === 'SEARCHING' || status === 'CONNECTING';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 md:p-6 overflow-hidden">
      
      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-center py-4 mb-4 md:mb-8 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Radio className="text-white h-5 w-5" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight">
            Stranger<span className="text-primary">Voice</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></div>
          <span className="hidden md:inline">{isConnected ? 'Online & Connected' : 'Disconnected'}</span>
          <span className="md:hidden">{isConnected ? 'On Air' : 'Offline'}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl flex-1 flex flex-col md:grid md:grid-cols-[1fr,350px] lg:grid-cols-[1fr,400px] gap-6 relative z-10">
        
        {/* Left Column: Call Visualization & Controls */}
        <div className="flex flex-col justify-between h-full min-h-[400px]">
          
          {/* Status Display Area */}
          <div className="flex-1 flex flex-col items-center justify-center relative">
            
            <AnimatePresence mode="wait">
              {status === 'IDLE' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center space-y-8"
                >
                  <div className="space-y-2">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tight">
                      Talk to <br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                        Someone New
                      </span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-md mx-auto">
                      Anonymous voice chat. No login required.
                    </p>
                  </div>
                  
                  <Button 
                    size="lg" 
                    onClick={findStranger}
                    className="h-16 px-10 rounded-full text-xl font-semibold bg-white text-black hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all transform hover:-translate-y-1"
                  >
                    Start Searching
                  </Button>
                </motion.div>
              )}

              {status === 'ERROR' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center space-y-6"
                >
                  <div className="space-y-2">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                      Connection issue
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-md mx-auto">
                      We couldn't reach the signaling server. Check that your deployment supports WebSockets or set VITE_SIGNALING_SERVER_URL, then try again.
                    </p>
                  </div>

                  <Button
                    size="lg"
                    onClick={findStranger}
                    className="h-14 px-8 rounded-full text-lg font-semibold bg-white text-black hover:bg-white/90 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                  >
                    Try again
                  </Button>
                </motion.div>
              )}

              {isSearching && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-8"
                >
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center animate-pulse-ring"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-2xl">
                        <Radio className="h-10 w-10 text-white animate-spin-slow" />
                      </div>
                    </div>
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="text-2xl font-bold">{status === 'SEARCHING' ? 'Finding a partner...' : 'Connecting...'}</h3>
                    <p className="text-muted-foreground">Please wait, this might take a moment.</p>
                  </div>
                  <Button variant="outline" onClick={leaveChat} className="rounded-full border-white/10 hover:bg-white/5">
                    Cancel
                  </Button>
                </motion.div>
              )}

              {isConnected && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex flex-col items-center gap-8"
                >
                  <div className="w-full max-w-md p-8 rounded-3xl bg-card border border-white/5 shadow-2xl backdrop-blur-sm">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold uppercase tracking-wider mb-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Live Call
                      </div>
                      <h3 className="text-2xl font-bold">Stranger</h3>
                      <p className="text-muted-foreground text-sm">Connected via secure WebRTC</p>
                    </div>

                    <AudioVisualizer stream={remoteStream} isActive={true} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Call Controls Bar */}
          <div className="w-full max-w-md mx-auto mt-8 p-4 rounded-2xl bg-card/80 border border-white/5 backdrop-blur-md shadow-2xl flex items-center justify-center gap-4 md:gap-6">
            <Button
              variant={isMuted ? "destructive" : "secondary"}
              size="icon"
              className="w-12 h-12 rounded-full shadow-lg"
              onClick={toggleMute}
              disabled={status === 'IDLE'}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            
            {status !== 'IDLE' ? (
              <Button
                variant="destructive"
                className="h-14 px-8 rounded-full font-bold text-base shadow-lg shadow-destructive/20 hover:shadow-destructive/40 transition-all hover:-translate-y-0.5"
                onClick={leaveChat}
              >
                <PhoneOff className="h-5 w-5 mr-2" />
                End Call
              </Button>
            ) : (
               <Button
                className="h-14 px-8 rounded-full font-bold text-base bg-white text-black hover:bg-white/90 shadow-lg"
                onClick={findStranger}
              >
                Start Call
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              className="w-12 h-12 rounded-full border-white/10 hover:bg-white/5 hover:border-primary/50 transition-all"
              onClick={skipStranger}
              disabled={!isConnected}
              title="Skip to next stranger"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
            
            <div className="w-px h-8 bg-white/10 mx-2"></div>
            
            <ReportModal onReportSubmitted={() => {
              if (isConnected) skipStranger();
            }} />
          </div>
        </div>

        {/* Right Column: Chat */}
        <div className={`
          fixed md:relative inset-0 z-20 md:z-0 bg-background md:bg-transparent
          flex flex-col transition-transform duration-300 ease-in-out
          ${status === 'IDLE' ? 'translate-x-full md:translate-x-0 md:opacity-50 md:pointer-events-none' : 'translate-x-0 opacity-100'}
        `}>
          {/* Mobile header for chat */}
          <div className="md:hidden p-4 border-b border-white/10 flex justify-between items-center">
             <h3 className="font-bold">Chat</h3>
             <Button variant="ghost" size="sm" onClick={() => { /* Toggle logic would go here if we had mobile chat toggle */ }}>Close</Button>
          </div>
          
          <ChatBox 
            messages={messages} 
            onSendMessage={sendMessage} 
            disabled={!isConnected}
          />
        </div>

      </main>

      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[100px]"></div>
      </div>
    </div>
  );
}
