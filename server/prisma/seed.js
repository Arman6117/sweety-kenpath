require("dotenv").config({
    path: require("path").resolve(__dirname, "../.env")
});

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function daysAgo(days) {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - days);
    return date;
}

async function main() {
    const passwordHash = await bcrypt.hash("SweetyDemo@2026", 12);

    const user = await prisma.user.upsert({
        where: {
            email: "demo@sweety.local"
        },
        update: {
            name: "Sweety Demo User",
            passwordHash
        },
        create: {
            name: "Sweety Demo User",
            email: "demo@sweety.local",
            passwordHash
        }
    });

    const sampleReadings = [
        { days: 3, slot: "MORNING", value: 105 },
        { days: 3, slot: "AFTER_BREAKFAST", value: 145 },
        { days: 3, slot: "AFTER_LUNCH", value: 132 },
        { days: 3, slot: "AFTER_DINNER", value: 128 },
        { days: 2, slot: "MORNING", value: 98 },
        { days: 2, slot: "AFTER_BREAKFAST", value: 139 },
        { days: 1, slot: "MORNING", value: 110 },
        { days: 1, slot: "AFTER_LUNCH", value: 150 }
    ];

    for (const reading of sampleReadings) {
        const date = daysAgo(reading.days);

        await prisma.reading.upsert({
            where: {
                userId_date_slot: {
                    userId: user.id,
                    date,
                    slot: reading.slot
                }
            },
            update: {
                value: reading.value
            },
            create: {
                userId: user.id,
                date,
                slot: reading.slot,
                value: reading.value
            }
        });
    }

    console.log("Demo user and sample readings created successfully.");
    console.log("Demo email: demo@sweety.local");
    console.log("Demo password: SweetyDemo@2026");
}

main()
    .catch((error) => {
        console.error("Seed failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });