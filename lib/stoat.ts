export async function sendStoatDM(discordId: string, message: string): Promise<boolean> {
  const webhookUrl = process.env.STOAT_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("STOAT_WEBHOOK_URL not set, skipping DM");
    return false;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        discord_id: discordId,
        content: message,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("Stoat DM failed:", err);
    return false;
  }
}
