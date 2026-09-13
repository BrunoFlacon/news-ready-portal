/**
 * Web Rádio Vitória — Player global.
 *
 * Mantém uma única instância do hook `useRadioPlayer` (transmissão ao vivo,
 * podcasts e vídeos/reels/stories) compartilhada por toda a aplicação, e
 * renderiza em qualquer página:
 *  - a barra ao vivo,
 *  - o elemento <audio> do conteúdo atual (sempre montado — minimizar a
 *    barra não interrompe a reprodução),
 *  - a barra estilo Spotify (podcast) com opção de minimizar,
 *  - o card flutuante quando minimizado,
 *  - o painel de sugestões pós-podcast,
 *  - o mini-player de vídeo flutuante.
 */
import { createContext, useContext } from "react";
import {
  FloatingPlayer,
  NowPlayingBar,
  RadioPlayerBar,
  SuggestionsPanel,
  VideoBubble,
  useRadioPlayer,
  type RadioPlayerApi,
} from "@/components/RadioPlayer";

const RadioPlayerContext = createContext<RadioPlayerApi | null>(null);

interface RadioPlayerProviderProps {
  children: React.ReactNode;
}

export function RadioPlayerProvider({ children }: RadioPlayerProviderProps) {
  const api = useRadioPlayer();

  const npAudioUrl =
    api.nowPlaying?.kind === "podcast" && api.nowPlaying.audioUrl
      ? api.nowPlaying.audioUrl
      : api.nowPlaying?.kind === "video" &&
          !api.nowPlaying.videoUrl &&
          api.nowPlaying.audioUrl
        ? api.nowPlaying.audioUrl
        : undefined;

  return (
    <RadioPlayerContext.Provider value={api}>
      {children}

      {/* Áudio <audio> persistente: vive aqui, fora das barras, para que
          minimizar/expandir nunca interrompa a reprodução. */}
      {npAudioUrl && (
        <audio
          data-testid="np-audio"
          ref={api.npAudioRef}
          src={npAudioUrl}
          preload="auto"
          className="hidden"
        />
      )}

      <RadioPlayerBar
        url={api.streamUrl}
        open={api.liveOpen}
        playing={api.livePlaying}
        error={api.liveError}
        togglePlay={api.toggleLivePlay}
        closePlayer={api.closePlayer}
        audioRef={api.liveAudioRef}
      />

      {api.nowPlaying?.kind === "podcast" && !api.minimized && (
        <NowPlayingBar
          nowPlaying={api.nowPlaying}
          playing={api.playbackPlaying}
          currentTime={api.currentTime}
          duration={api.duration}
          volume={api.volume}
          muted={api.muted}
          playbackRate={api.playbackRate}
          onSeekTo={api.seekTo}
          onSeekBackward={api.seekBackward}
          onSeekForward={api.seekForward}
          onToggleMute={api.toggleMute}
          onVolumeChange={api.changeVolume}
          onCycleRate={api.cyclePlaybackRate}
          hasQueue={api.queue.length > 0}
          onPrevious={api.playPrevious}
          onNext={api.playNext}
          onTogglePlay={api.togglePlayback}
          onMinimize={api.minimize}
          onClose={api.closeNowPlaying}
        />
      )}

      {api.nowPlaying && api.minimized && (
        <FloatingPlayer
          nowPlaying={api.nowPlaying}
          playing={api.playbackPlaying}
          onTogglePlay={api.togglePlayback}
          onExpand={api.expand}
          onClose={api.closeNowPlaying}
        />
      )}

      {api.nowPlaying?.kind === "video" && !api.minimized && (
        <VideoBubble
          nowPlaying={api.nowPlaying}
          muted={api.muted}
          playbackRate={api.playbackRate}
          audioRef={api.npAudioRef}
          videoRef={api.videoRef}
          onEnded={api.handleMediaEnded}
          onToggleMute={api.toggleMute}
          onCycleRate={api.cyclePlaybackRate}
          onSeekBackward={api.seekBackward}
          onSeekForward={api.seekForward}
          onClose={api.closeNowPlaying}
        />
      )}

      {api.suggestionsOpen && api.nowPlaying && (
        <SuggestionsPanel
          podcastTitle={api.nowPlaying.title}
          onPlayPodcast={api.playPodcast}
          onPlayVisual={api.playVisual}
          onDismiss={api.dismissSuggestions}
        />
      )}
    </RadioPlayerContext.Provider>
  );
}

export function useRadioPlayerContext(): RadioPlayerApi {
  const context = useContext(RadioPlayerContext);
  if (!context) {
    throw new Error(
      "useRadioPlayerContext deve ser usado dentro de RadioPlayerProvider",
    );
  }
  return context;
}