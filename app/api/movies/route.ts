import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const movies = await prisma.movie.findMany({
    take: 10,
    orderBy: { released: "desc" },
    select: {
      id: true,
      title: true,
      year: true,
      poster: true,
      released: true,
    },
  });

  return NextResponse.json({ movies });
}
