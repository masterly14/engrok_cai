"use client"

import { useEffect, useState } from "react"
import { Bell, CheckCircle } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import Pusher from "pusher-js"
import { toast } from "sonner"

interface Notification {
  id: string
  message: string
  link?: string
  read: boolean
  createdAt: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications)
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  // Subscribe to pusher channel for real-time refresh
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) return

    let userId: string | null = null

    // Obtain user id once
    fetch("/api/users/current")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.id) return
        userId = data.id
        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        })
        const channelName = `notifications-for-user-${userId}`
        const channel = pusher.subscribe(channelName)
        channel.bind("new_notification", () => {
          fetchNotifications()
          toast.info("Tienes una nueva notificación")
        })
        return () => {
          channel.unbind_all()
          pusher.unsubscribe(channelName)
        }
      })
      .catch(() => {})
  }, [])

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, { method: "PATCH" })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-accent/50 transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full h-4 w-4 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-3 border-b">
          <h4 className="font-semibold text-sm">Notificaciones</h4>
        </div>
        <ScrollArea className="max-h-72">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No hay notificaciones</div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="px-4 py-3 border-b last:border-none flex items-start gap-2">
                {!n.read ? (
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-blue-500" />
                ) : (
                  <CheckCircle className="h-3 w-3 text-muted-foreground mt-0.5" />
                )}
                <div className="flex-1 text-sm">
                  {n.link ? (
                    <a
                      href={n.link}
                      className="hover:underline"
                      onClick={() => handleMarkRead(n.id)}
                    >
                      {n.message}
                    </a>
                  ) : (
                    <span>{n.message}</span>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
} 