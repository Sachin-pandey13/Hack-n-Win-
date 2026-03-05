// pages/api/socket.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { Server as IOServer } from "socket.io";

type ChatMsg = {
  id: string;       // nanoid
  user: string;     // display name
  text: string;     // message
  ts: number;       // Date.now()
};

type Rooms = Record<string, ChatMsg[]>;

declare global {
  // eslint-disable-next-line no-var
  var __chatRooms: Rooms | undefined;
}

const rooms: Rooms = global.__chatRooms ?? (global.__chatRooms = {});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Reuse the same IO instance across dev reloads
  const anyRes = res as any;
  if (!anyRes.socket.server.io) {
    const io = new IOServer(anyRes.socket.server, {
      path: "/api/socket",
      cors: { origin: "*" },
    });
    anyRes.socket.server.io = io;

    io.on("connection", (socket) => {
      // Client joins a room for the current problem
      socket.on("joinRoom", (room: string) => {
        socket.join(room);
        const history = rooms[room] ?? [];
        socket.emit("chat:history", history);
      });

      // Broadcast message to a room + store last 100
      socket.on(
        "chat:message",
        ({ room, msg }: { room: string; msg: ChatMsg }) => {
          rooms[room] = [...(rooms[room] ?? []), msg].slice(-100);
          io.to(room).emit("chat:message", msg);
        }
      );

      // Optional: typing indicators
      socket.on("chat:typing", ({ room, user }: { room: string; user: string }) => {
        socket.to(room).emit("chat:typing", { user });
      });
    });
  }

  res.end();
}
