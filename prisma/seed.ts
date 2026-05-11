import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

const db = new PrismaClient();

async function main() {
  await db.mahnung.deleteMany();
  await db.rechnung.deleteMany();
  await db.kunde.deleteMany();

  const thomas = await db.kunde.create({
    data: {
      name: "Thomas Müller",
      email: "thomas.mueller@elektro-mueller.de",
      phone: "+49 89 123456",
      address: "Rosenheimer Str. 12, 81669 München",
      rechnungen: {
        create: {
          rechnungsnummer: "RE-2026-001",
          betrag: 1480.0,
          faelligkeitsdatum: new Date("2026-04-15"),
          status: "offen",
        },
      },
    },
  });

  const sarah = await db.kunde.create({
    data: {
      name: "Sarah Koch",
      email: "s.koch@malerbetrieb-koch.de",
      phone: "+49 40 987654",
      address: "Altona-Allee 34, 22303 Hamburg",
      rechnungen: {
        create: {
          rechnungsnummer: "RE-2026-002",
          betrag: 3250.5,
          faelligkeitsdatum: new Date("2026-04-22"),
          status: "offen",
        },
      },
    },
  });

  const andreas = await db.kunde.create({
    data: {
      name: "Andreas Weber",
      email: "weber@klempnerei-weber.de",
      phone: "+49 711 456789",
      address: "Stuttgarter Str. 7, 70469 Stuttgart",
      rechnungen: {
        create: {
          rechnungsnummer: "RE-2026-003",
          betrag: 920.0,
          faelligkeitsdatum: new Date("2026-04-30"),
          status: "offen",
        },
      },
    },
  });

  console.log("Seed complete:");
  console.log(`  Kunde: ${thomas.name}`);
  console.log(`  Kunde: ${sarah.name}`);
  console.log(`  Kunde: ${andreas.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
