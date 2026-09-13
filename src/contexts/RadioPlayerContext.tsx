/**
 * Web Rádio Vitória — Player global.
 *
 * Mantém uma única instância do hook `useRadioPlayer` (estado, elemento de
 * áudio e barra fixa) compartilhada por toda a aplicação, permitindo que o
 * cabeçalho, o hero e qualquer outro ponto abram o mesmo player.
 */
import { createContext, useContext } from "react";
import {
  RadioPlayerBar,
  useRadioPlayer,
  type RadioPlayerApi,
} from "@/components/RadioPlayer";

const RadioPlayerContext = createContext<RadioPlayerApi | null>(null);

interface RadioPlayerProviderProps {
  children: React.ReactNode;
}

export function RadioPlayerProvider({ children }: RadioPlayerProviderProps) {
  const api = useRadioPlayer();

  return (
    <RadioPlayerContext.Provider value={api}>
      {children}
      <RadioPlayerBar
        url={api.streamUrl}
        open={api.open}
        playing={api.playing}
        error={api.error}
        togglePlay={api.togglePlay}
        closePlayer={api.closePlayer}
        audioRef={api.audioRef}
      />
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