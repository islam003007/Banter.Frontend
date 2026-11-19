import {
  ReadableStream as NodeReadableStream,
  TransformStream as NodeTransformStream,
  WritableStream as NodeWritableStream,
} from 'node:stream/web';
import { MessageChannel as NodeMessageChannel, MessagePort as NodeMessagePort } from 'node:worker_threads';

const globals = globalThis as Record<string, unknown>;

if (!globals.ReadableStream) {
  globals.ReadableStream = NodeReadableStream;
}
if (!globals.TransformStream) {
  globals.TransformStream = NodeTransformStream;
}
if (!globals.WritableStream) {
  globals.WritableStream = NodeWritableStream;
}
if (!globals.MessageChannel) {
  globals.MessageChannel = NodeMessageChannel;
}
if (!globals.MessagePort) {
  globals.MessagePort = NodeMessagePort;
}
