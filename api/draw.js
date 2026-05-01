const url = "https://api.qrng.outshift.com/api/v1/random_numbers";

const CARDS = [
  "The Fool", "The Magician", "The High Priestess", "The Empress",
  "The Emperor", "The Hierophant", "The Lovers", "The Chariot",
  "Strength", "The Hermit", "Wheel of Fortune", "Justice",
  "The Hanged Man", "Death", "Temperance", "The Devil",
  "The Tower", "The Star", "The Moon", "The Sun",
  "Judgment", "The World", "Ace of Wands", "Two of Wands",
  "Three of Wands", "Four of Wands", "Five of Wands", "Six of Wands",
  "Seven of Wands", "Eight of Wands", "Nine of Wands", "Ten of Wands",
  "Page of Wands", "Knight of Wands", "Queen of Wands", "King of Wands",
  "Ace of Pentacles", "Two of Pentacles", "Three of Pentacles", "Four of Pentacles",
  "Five of Pentacles", "Six of Pentacles", "Seven of Pentacles", "Eight of Pentacles",
  "Nine of Pentacles", "Ten of Pentacles", "Page of Pentacles", "Knight of Pentacles",
  "Queen of Pentacles", "King of Pentacles", "Ace of Swords", "Two of Swords",
  "Three of Swords", "Four of Swords", "Five of Swords", "Six of Swords",
  "Seven of Swords", "Eight of Swords", "Nine of Swords", "Ten of Swords",
  "Page of Swords", "Knight of Swords", "Queen of Swords", "King of Swords",
  "Ace of Cups", "Two of Cups", "Three of Cups", "Four of Cups",
  "Five of Cups", "Six of Cups", "Seven of Cups", "Eight of Cups",
  "Nine of Cups", "Ten of Cups", "Page of Cups", "Knight of Cups",
  "Queen of Cups", "King of Cups",
];

const REJECTION_LIMIT = 65520;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.QRNG_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "QRNG_API_KEY not configured" });
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-id-api-key": apiKey,
      },
      body: JSON.stringify({
        encoding: "raw",
        format: "all",
        bits_per_block: 16,
        number_of_blocks: 1,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `QRNG API error: ${text}` });
    }

    const result = await response.json();
    const raw = parseInt(result.random_numbers[0].decimal, 10);
    const accepted = raw < REJECTION_LIMIT;

    if (!accepted) {
      return res.status(200).json({ raw, accepted: false, card: null, reversed: null });
    }

    const mapped = raw % 156;
    const cardNum = mapped % 78;
    const reversed = mapped >= 78;

    return res.status(200).json({
      raw,
      accepted: true,
      card: CARDS[cardNum],
      reversed,
    });
  } catch (err) {
    return res.status(500).json({ error: `Request failed: ${err.message}` });
  }
}
