import type {
  AdditionalDamageCard,
  DestroyerSquadronCard,
  GunCaliber,
  MinefieldCard,
  PlayCard,
  SalvoCard,
  ShipCard
} from "./types.js";

function ship(
  id: string,
  name: string,
  hitNumber: number,
  faction: string,
  options: { gunCaliber?: GunCaliber; isCarrier?: boolean } = {}
): ShipCard {
  const card: ShipCard = {
    id,
    name,
    hitNumber,
    faction,
    isCarrier: options.isCarrier ?? false
  };

  if (options.gunCaliber) {
    card.gunCaliber = options.gunCaliber;
  }

  return card;
}

function salvo(id: string, gunCaliber: GunCaliber, hits: 1 | 2 | 3 | 4): SalvoCard {
  return { id, kind: "salvo", gunCaliber, hits };
}

function minefield(id: string, hits: 1 | 2): MinefieldCard {
  return { id, kind: "minefield", hits };
}

function additionalDamage(id: string, hits: 1 | 2): AdditionalDamageCard {
  return { id, kind: "additional_damage", hits };
}

function destroyer(id: string): DestroyerSquadronCard {
  return { id, kind: "destroyer_squadron", hits: 4 };
}

export const fullShipDeck: ShipCard[] = [
  ship("ship-nelson", "Nelson", 9, "Great Britain", { gunCaliber: '16"' }),
  ship("ship-shokaku", "Shokaku", 3, "Japan", { isCarrier: true }),
  ship("ship-king-george-v", "King George V", 9, "Great Britain", { gunCaliber: '14"' }),
  ship("ship-warspite", "Warspite", 5, "Great Britain", { gunCaliber: '15"' }),
  ship("ship-south-dakota", "South Dakota", 9, "United States", { gunCaliber: '16"' }),
  ship("ship-valiant", "Valiant", 5, "Great Britain", { gunCaliber: '15"' }),
  ship("ship-littorio", "Littorio", 9, "Italy", { gunCaliber: '15"' }),
  ship("ship-new-jersey", "New Jersey", 7, "United States", { gunCaliber: '16"' }),
  ship("ship-vittorio-veneto", "Vittorio Veneto", 9, "Italy", { gunCaliber: '15"' }),
  ship("ship-north-carolina", "North Carolina", 9, "United States", { gunCaliber: '16"' }),
  ship("ship-maryland", "Maryland", 5, "United States", { gunCaliber: '16"' }),
  ship("ship-prince-of-wales", "Prince of Wales", 9, "Great Britain", { gunCaliber: '14"' }),
  ship("ship-nagato", "Nagato", 9, "Japan", { gunCaliber: '16"' }),
  ship("ship-hyuga", "Hyuga", 5, "Japan", { gunCaliber: '14"' }),
  ship("ship-scharnhorst", "Scharnhorst", 5, "Germany", { gunCaliber: '11"' }),
  ship("ship-haruna", "Haruna", 5, "Japan", { gunCaliber: '14"' }),
  ship("ship-hiei", "Hiei", 5, "Japan", { gunCaliber: '14"' }),
  ship("ship-rodney", "Rodney", 9, "Great Britain", { gunCaliber: '16"' }),
  ship("ship-enterprise", "Enterprise", 3, "United States", { isCarrier: true }),
  ship("ship-west-virginia", "West Virginia", 5, "United States", { gunCaliber: '16"' }),
  ship("ship-kirishima", "Kirishima", 5, "Japan", { gunCaliber: '14"' }),
  ship("ship-washington", "Washington", 9, "United States", { gunCaliber: '16"' }),
  ship("ship-ise", "Ise", 5, "Japan", { gunCaliber: '14"' }),
  ship("ship-duke-of-york", "Duke of York", 9, "Great Britain", { gunCaliber: '14"' }),
  ship("ship-musashi", "Musashi", 9, "Japan", { gunCaliber: '18"' }),
  ship("ship-yamato", "Yamato", 9, "Japan", { gunCaliber: '18"' }),
  ship("ship-andrea-doria", "Andrea Doria", 4, "Italy", { gunCaliber: '12.6"' }),
  ship("ship-hood", "Hood", 5, "Great Britain", { gunCaliber: '15"' }),
  ship("ship-iowa", "Iowa", 7, "United States", { gunCaliber: '16"' }),
  ship("ship-lutzow", "Lutzow", 3, "Germany", { gunCaliber: '11"' }),
  ship("ship-gneisenau", "Gneisenau", 5, "Germany", { gunCaliber: '11"' }),
  ship("ship-repulse", "Repulse", 4, "Great Britain", { gunCaliber: '15"' }),
  ship("ship-missouri", "Missouri", 7, "United States", { gunCaliber: '16"' }),
  ship("ship-mississippi", "Mississippi", 5, "United States", { gunCaliber: '14"' }),
  ship("ship-revenge", "Revenge", 4, "Great Britain", { gunCaliber: '15"' }),
  ship("ship-giulio-cesare", "Giulio Cesare", 4, "Italy", { gunCaliber: '12.6"' }),
  ship("ship-california", "California", 5, "United States", { gunCaliber: '14"' }),
  ship("ship-ark-royal", "Ark Royal", 3, "Great Britain", { isCarrier: true }),
  ship("ship-pennsylvania", "Pennsylvania", 5, "United States", { gunCaliber: '14"' }),
  ship("ship-conte-di-cavour", "Conte di Cavour", 4, "Italy", { gunCaliber: '12.6"' }),
  ship("ship-bismarck", "Bismarck", 8, "Germany", { gunCaliber: '15"' }),
  ship("ship-tirpitz", "Tirpitz", 8, "Germany", { gunCaliber: '15"' }),
  ship("ship-fuso", "Fuso", 5, "Japan", { gunCaliber: '14"' }),
  ship("ship-roma", "Roma", 6, "Italy", { gunCaliber: '15"' }),
  ship("ship-caio-duilio", "Caio Duilio", 4, "Italy", { gunCaliber: '12.6"' }),
  ship("ship-graf-spee", "Graf Spee", 3, "Germany", { gunCaliber: '11"' }),
  ship("ship-ramillies", "Ramillies", 4, "Great Britain", { gunCaliber: '15"' }),
  ship("ship-akagi", "Akagi", 3, "Japan", { isCarrier: true }),
  ship("ship-renown", "Renown", 4, "Great Britain", { gunCaliber: '15"' }),
  ship("ship-nevada", "Nevada", 5, "United States", { gunCaliber: '14"' }),
  ship("ship-texas", "Texas", 4, "United States", { gunCaliber: '14"' }),
  ship("ship-scheer", "Scheer", 3, "Germany", { gunCaliber: '11"' }),
  ship("ship-mutsu", "Mutsu", 9, "Japan", { gunCaliber: '16"' }),
  ship("ship-kongo", "Kongo", 5, "Japan", { gunCaliber: '14"' })
];

function pushCopies(deck: PlayCard[], count: number, create: (index: number) => PlayCard) {
  for (let index = 1; index <= count; index += 1) {
    deck.push(create(index));
  }
}

export function buildFullPlayDeck(): PlayCard[] {
  const deck: PlayCard[] = [];

  pushCopies(deck, 8, (i) => salvo(`salvo-11-1-${i}`, '11"', 1));
  pushCopies(deck, 2, (i) => salvo(`salvo-11-2-${i}`, '11"', 2));
  pushCopies(deck, 4, (i) => salvo(`salvo-12_6-1-${i}`, '12.6"', 1));
  pushCopies(deck, 5, (i) => salvo(`salvo-12_6-2-${i}`, '12.6"', 2));
  pushCopies(deck, 10, (i) => salvo(`salvo-14-1-${i}`, '14"', 1));
  pushCopies(deck, 9, (i) => salvo(`salvo-14-2-${i}`, '14"', 2));
  pushCopies(deck, 2, (i) => salvo(`salvo-14-3-${i}`, '14"', 3));
  pushCopies(deck, 2, (i) => salvo(`salvo-15-1-${i}`, '15"', 1));
  pushCopies(deck, 5, (i) => salvo(`salvo-15-2-${i}`, '15"', 2));
  pushCopies(deck, 4, (i) => salvo(`salvo-15-3-${i}`, '15"', 3));
  pushCopies(deck, 4, (i) => salvo(`salvo-16-1-${i}`, '16"', 1));
  pushCopies(deck, 4, (i) => salvo(`salvo-16-2-${i}`, '16"', 2));
  pushCopies(deck, 4, (i) => salvo(`salvo-16-3-${i}`, '16"', 3));
  pushCopies(deck, 3, (i) => salvo(`salvo-16-4-${i}`, '16"', 4));
  pushCopies(deck, 3, (i) => salvo(`salvo-18-2-${i}`, '18"', 2));
  pushCopies(deck, 2, (i) => salvo(`salvo-18-3-${i}`, '18"', 3));
  pushCopies(deck, 2, (i) => salvo(`salvo-18-4-${i}`, '18"', 4));
  pushCopies(deck, 8, (i) => ({ id: `additional-ship-${i}`, kind: "additional_ship" }));
  pushCopies(deck, 4, (i) => additionalDamage(`additional-damage-1-${i}`, 1));
  pushCopies(deck, 2, (i) => additionalDamage(`additional-damage-2-${i}`, 2));
  pushCopies(deck, 1, (i) => ({ id: `torpedo-boat-${i}`, kind: "torpedo_boat" }));
  pushCopies(deck, 2, (i) => destroyer(`destroyer-squadron-${i}`));
  pushCopies(deck, 6, (i) => ({ id: `smoke-${i}`, kind: "smoke" }));
  pushCopies(deck, 4, (i) => ({ id: `repair-${i}`, kind: "repair" }));
  pushCopies(deck, 2, (i) => minefield(`minefield-1-${i}`, 1));
  pushCopies(deck, 2, (i) => minefield(`minefield-2-${i}`, 2));
  pushCopies(deck, 2, (i) => ({ id: `minesweeper-${i}`, kind: "minesweeper" }));
  pushCopies(deck, 2, (i) => ({ id: `submarine-${i}`, kind: "submarine" }));

  return deck;
}

export const fullPlayDeck: PlayCard[] = buildFullPlayDeck();
