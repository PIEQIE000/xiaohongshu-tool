import { NextResponse } from "next/server"
import { networkInterfaces } from "os"

export async function GET() {
  const nets = networkInterfaces()
  for (const [name, net] of Object.entries(nets)) {
    if (!net || name.startsWith("lo")) continue
    for (const iface of net) {
      if (iface.family === "IPv4" && !iface.internal && !iface.address.startsWith("127")) {
        return NextResponse.json({ ip: iface.address })
      }
    }
  }
  return NextResponse.json({ ip: null })
}
