export const environment = {
  production: false,
  get apiUrl(): string {
    if (typeof window !== 'undefined' && window.location.port !== '4200') {
      return `${window.location.origin}/api`;
    }
    return 'http://localhost:8000/api';
  },
  get wsUrl(): string {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.port === '4200' ? 'localhost:8000' : window.location.host;
      return `${protocol}//${host}/ws`;
    }
    return 'ws://localhost:8000/ws';
  }
};
