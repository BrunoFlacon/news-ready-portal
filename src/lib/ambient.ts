/**
 * Web Rádio Vitória — Cores ambiente do player.
 *
 * Extrai a paleta predominante da capa do vídeo (via <canvas>) para preencher
 * o fundo do banner gigante com um desfoque suave animado, evitando áreas
 * vazias em telas grandes. Em qualquer falha (canvas indisponível, CORS,
 * rede), retorna uma paleta padrão da marca.
 */
export interface AmbientPalette {
  a: string;
  b: string;
}

const FALLBACK: AmbientPalette = { a: "#7c2d12", b: "#1c1917" };

export async function extractPalette(
  imageUrl: string,
): Promise<AmbientPalette> {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`falha ao carregar ${imageUrl}`));
      img.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return FALLBACK;
    }
    ctx.drawImage(img, 0, 0, 32, 32);
    const { data } = ctx.getImageData(0, 0, 32, 32);

    const top = [0, 0, 0];
    const bottom = [0, 0, 0];
    let nTop = 0;
    let nBottom = 0;
    for (let i = 0; i < data.length; i += 4) {
      const row = Math.floor(i / 4 / 32);
      const bucket = row < 16 ? top : bottom;
      bucket[0] += data[i];
      bucket[1] += data[i + 1];
      bucket[2] += data[i + 2];
      if (row < 16) {
        nTop += 1;
      } else {
        nBottom += 1;
      }
    }
    const rgb = (sum: number[], count: number) =>
      `rgb(${Math.round(sum[0] / count)} ${Math.round(sum[1] / count)} ${Math.round(sum[2] / count)})`;

    return { a: rgb(top, nTop), b: rgb(bottom, nBottom) };
  } catch {
    return FALLBACK;
  }
}