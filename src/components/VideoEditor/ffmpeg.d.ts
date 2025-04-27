
declare module '@ffmpeg/ffmpeg' {
  export interface FFmpeg {
    load(): Promise<void>;
    run(...args: string[]): Promise<void>;
    FS(method: string, path: string, data?: Uint8Array): Uint8Array | void;
    setProgress(progress: (progress: { ratio: number }) => void): void;
    setLogger(logger: (message: any) => void): void;
  }

  export interface CreateFFmpegOptions {
    log?: boolean;
    logger?: (message: any) => void;
    corePath?: string;
    progress?: (progress: { ratio: number }) => void;
    mainName?: string;
  }

  export function createFFmpeg(options?: CreateFFmpegOptions): FFmpeg;
  export function fetchFile(file: string | File | Blob): Promise<Uint8Array>;
}
