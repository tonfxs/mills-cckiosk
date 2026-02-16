import { NextResponse } from "next/server";

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "25");
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || "";

  const stream = new ReadableStream({
    async start(controller) {
      let isActive = true;

      // Ping every 15s
      const ping = setInterval(() => {
        if (!isActive) return;
        controller.enqueue(`:\n\n`);
      }, 15000);

      const sendData = async () => {
        if (!isActive) return;

        try {
          const url = `${req.url.replace("/returns-stream", "/returns-datatable")}?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}&page=${page}&pageSize=${pageSize}`;
          const res = await fetch(url, { cache: "no-store" });
          const text = await res.text();
          let json: any;
          try { json = JSON.parse(text); } catch { json = { data: { items: [], total: 0, page, pageSize, totalPages: 1, statuses: [] } }; }

          controller.enqueue(`data: ${JSON.stringify(json.data)}\n\n`);
        } catch (err) {
          console.error("SSE returns error:", err);
        }
      };

      // Initial send
      await sendData();

      // Poll every 5s
      const interval = setInterval(sendData, 5000);

      // Client disconnect
      req.signal.addEventListener("abort", () => {
        isActive = false;
        clearInterval(interval);
        clearInterval(ping);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
