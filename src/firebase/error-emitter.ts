'use client';

/**
 * Custom EventEmitter for client-side use to avoid Node.js 'events' module dependency issues.
 */
type Listener = (...args: any[]) => void;

class SimpleEmitter {
  private listeners: { [event: string]: Listener[] } = {};

  on(event: string, listener: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(listener);
  }

  off(event: string, listener: Listener) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(l => l(...args));
  }
}

export const errorEmitter = new SimpleEmitter();
