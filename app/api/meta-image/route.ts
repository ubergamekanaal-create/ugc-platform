export async function GET(req: Request) {
  const url = new URL(req.url).searchParams.get("url");

  if (!url) {
    return new Response("Missing URL", { status: 400 });
  }

  const upstream = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("Failed to fetch image", { status: 500 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "image/jpeg",
      "Content-Length": upstream.headers.get("content-length") || "",
      "Cache-Control": "public, max-age=31536000",
    },
  });
}