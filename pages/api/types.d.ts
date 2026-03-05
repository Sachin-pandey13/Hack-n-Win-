import type { Server as NetServer } from "http";
import type { Socket } from "net";
import type { Server as IOServer } from "socket.io";

export type NextApiResponseServerIO = {
  socket: Socket & {
    server: NetServer & { io?: IOServer };
  };
} & Response;
