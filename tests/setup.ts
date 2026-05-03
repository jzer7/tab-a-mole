import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');

// Expose DOM globals needed by tests
global.document = dom.window.document as unknown as Document;
global.window = dom.window as unknown as Window & typeof globalThis;
