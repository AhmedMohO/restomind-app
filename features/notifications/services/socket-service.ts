"use client"

import { io, Socket } from "socket.io-client"
import type { NotificationItem } from "../types"

type NotificationHandler = (notification: NotificationItem) => void

class NotificationSocketService {
  private socket: Socket | null = null
  private listeners: Set<NotificationHandler> = new Set()
  private isConnecting = false

  /**
   * Fetches the JWT token from BFF and connects to the backend Socket.IO gateway.
   */
  public async connect(): Promise<Socket | null> {
    if (this.socket?.connected) {
      return this.socket
    }

    if (this.isConnecting) {
      return null
    }

    this.isConnecting = true

    try {
      // 1. Fetch token and target WebSocket URL from BFF
      const res = await fetch("/api/auth/socket-token", {
        credentials: "include",
      })

      if (!res.ok) {
        console.warn("[NotificationSocketService] Not authenticated for WebSocket connection.")
        return null
      }

      const json = await res.json()
      if (!json.success || !json.data?.token) {
        console.warn("[NotificationSocketService] Failed to obtain socket token.")
        return null
      }

      const { token, wsUrl } = json.data as { token: string; wsUrl: string }

      // Cleanup existing socket if any
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
      }

      // 2. Initialize Socket.IO connection to /notifications namespace
      const socket = io(`${wsUrl}/notifications`, {
        auth: {
          token: `Bearer ${token}`,
        },
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      })

      socket.on("connect", () => {
        console.log("🟢 Connected to Notification WebSocket:", socket.id)
      })

      socket.on("notification:new", (data: NotificationItem) => {
        console.log("🔔 Live notification received:", data)
        this.notifyListeners(data)
      })

      socket.on("connect_error", (error) => {
        console.warn("⚠️ WebSocket connection error:", error.message)
      })

      socket.on("disconnect", (reason) => {
        console.log("🔴 Disconnected from Notification WebSocket:", reason)
      })

      this.socket = socket
      return socket
    } catch (err) {
      console.error("[NotificationSocketService] Error establishing socket connection:", err)
      return null
    } finally {
      this.isConnecting = false
    }
  }

  /**
   * Disconnects the socket connection cleanly.
   */
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  /**
   * Subscribe to live notification events.
   */
  public subscribe(handler: NotificationHandler): () => void {
    this.listeners.add(handler)
    return () => {
      this.listeners.delete(handler)
    }
  }

  private notifyListeners(notification: NotificationItem) {
    this.listeners.forEach((handler) => {
      try {
        handler(notification)
      } catch (err) {
        console.error("[NotificationSocketService] Error in listener callback:", err)
      }
    })
  }

  public getSocket(): Socket | null {
    return this.socket
  }
}

export const notificationSocketService = new NotificationSocketService()
