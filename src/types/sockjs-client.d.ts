declare module 'sockjs-client' {
  interface SockJS {
    readyState: number;
    url: string;
    onopen: ((event: any) => void) | null;
    onclose: ((event: any) => void) | null;
    onmessage: ((event: any) => void) | null;
    onerror: ((event: any) => void) | null;
    close(): void;
    send(data: string): void;
  }

  interface SockJSStatic {
    new (url: string, _reserved?: any, options?: any): SockJS;
  }

  const SockJS: SockJSStatic;
  export default SockJS;
}
