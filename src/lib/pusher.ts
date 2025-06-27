import PusherServer from "pusher"

// To avoid creating a new instance on every hot-reload in dev
declare global {
  var pusherServerInstance: PusherServer | undefined
}

export const pusherServer =
  global.pusherServerInstance ||
  new PusherServer({
    appId: process.env.PUSHER_APP_ID!,
    key: process.env.PUSHER_KEY!,
    secret: process.env.PUSHER_SECRET!,
    cluster: process.env.PUSHER_CLUSTER!,
    useTLS: true,
  })

if (process.env.NODE_ENV !== "production") {
  global.pusherServerInstance = pusherServer
} 