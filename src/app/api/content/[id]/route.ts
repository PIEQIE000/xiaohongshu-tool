import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await prisma.content.delete({
    where: { id: params.id },
  })
  return NextResponse.json({ ok: true })
}
