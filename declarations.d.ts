declare global {
  interface FileSystemWritableFileStream {
    write(data: Blob): Promise<void>;
    close(): Promise<void>;
  }

  interface FileSystemFileHandle {
    createWritable(): Promise<FileSystemWritableFileStream>;
  }

  interface Window {
    webkitAudioContext: AudioContext;
    showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;
  }
}

export {};
