import { io, Socket } from "socket.io-client";
import { getToken } from "./auth";

const PROD_SOCKET = "https://taskflow-wwrr.onrender.com";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (process.env.NODE_ENV === "production"
    ? PROD_SOCKET
    : "http://localhost:5000");

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      auth: {
        token: getToken() || "",
      },
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  s.auth = { token: getToken() || "" };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}

export function joinWorkspaceRoom(workspaceId: string) {
  const s = connectSocket();
  s.emit("workspace:join", workspaceId);
}

export function leaveWorkspaceRoom(workspaceId: string) {
  socket?.emit("workspace:leave", workspaceId);
}
