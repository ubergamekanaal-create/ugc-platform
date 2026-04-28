// /api/meta-image
export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("url");

  if (!url) {
    return new Response("Missing URL", { status: 400 });
  }

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!res.ok) {
    return new Response("Failed to fetch image", { status: 500 });
  }

  const buffer = await res.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=31536000",
    },
  });
}