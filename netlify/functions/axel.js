export default async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = JSON.parse(req.body || "{}");

    const message = String(body.message || "").trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message) {
      return jsonResponse({ reply: "Tulis pertanyaan dulu." }, 400);
    }

    const contents = [
      ...history.map((item) => ({
        role: item.role === "user" ? "user" : "model",
        parts: [{ text: String(item.text || "") }]
      })),
      {
        role: "user",
        parts: [{ text: message }]
      }
    ];

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{
              text: `Kamu adalah AXEL.AI, personal AI assistant.

Gaya bicara:
- Bahasa Indonesia santai dan natural.
- Gunakan “lu” untuk user dan “gue” untuk AXEL.
- Jangan terlalu formal dan jangan terlalu banyak emoji.
- Jawab jelas, ringkas, dan berguna.
- Jika user bertanya dalam Bahasa Inggris, jawab dalam Bahasa Inggris.
- Jangan mengklaim AXEL.AI terhubung ke model AI tertentu.`
            }]
          }
        })
      }
    );

    const data = await response.json();

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Maaf, AXEL belum bisa menghasilkan jawaban untuk permintaan itu.";

    return jsonResponse({ reply });
  } catch (error) {
    return jsonResponse({
      reply: "Maaf, terjadi kendala saat memproses permintaan."
    }, 500);
  }
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
