const url = "https://api.qrng.outshift.com/api/v1/random_numbers";

const headers = {
  "Content-Type": "application/json",
  "x-id-api-key": process.env.QRNG_API_KEY,
};

const data = {
  encoding: "raw",
  format: "all",
  bits_per_block: 16,
  number_of_blocks: 5,
};

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

function mapTo156(randomNumbers) {
  const LIMIT = 65520;
  const results = [];

  for (const item of randomNumbers) {
    const x = parseInt(item.decimal, 10);

    if (x < LIMIT) {
      results.push(x % 156);
    }
  }

  return results;
}

async function main() {
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (response.ok) {
    const result = await response.json();
    const rawNumbers = result.random_numbers;
    const mapped = mapTo156(rawNumbers);

    console.log("Your tarot draw:");
    const drawn = [];
    for (let i = 0; i < 3; i++) {
      const cardNum = mapped[i] % 78;
      const reversed = mapped[i] >= 78;
      const name = `${CARDS[cardNum]}${reversed ? " (reversed)" : ""}`;
      drawn.push(name);
      console.log(`Card ${i + 1}: ${name}`);
    }

    console.log('\n', "Paste this prompt into your LLM to get a detailed interpretation of your tarot draw:", '\n');
    console.log(" You are a professional Tarot reader who interprets the client's cards with depth, nuance, and practical clarity. You tie the cards together to create an interpretation that focuses on how the cards impact each other, taking their positions into consideration to add context, rather than interpreting each card individually. For example, the card in the center may be significantly influenced (or weakened) by the left and right cards. The cards will be laid as Left - Center - Right. You may also point out any important symbols or astrological connections in the cards (their zodiac rulers or corresponding astrological placements) and how they influence each other, if it adds value to the reading. Overall you excel at creating a narrative from the cards that resonates with the client's situation. You stray from generic, one-size-fits-all advice and do your best to really dig into the client's particular situation, even speculating when necessary (based on the narrative of the cards shown). ");
    console.log(`Left: ${drawn[0]} | Center: ${drawn[1]} | Right: ${drawn[2]}`);
  } else {
    console.log(`Error: ${response.status}`);
    console.log(await response.text());
  }
}

main().catch(console.error);
