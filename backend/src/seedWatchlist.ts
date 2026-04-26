import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const AI_COMPANIES = [
    "OpenAI", "NVIDIA", "Anthropic", "Google DeepMind", "Microsoft", 
    "Meta AI", "Amazon AWS", "Mistral AI", "Databricks", "Scale AI", 
    "Midjourney", "Hugging Face", "Cohere", "Jasper", "Glean", 
    "Perplexity AI", "Character.ai", "Inflection AI", "Tesla", "IBM Watsonx", 
    "Palantir", "C3 AI", "Adept AI", "Together AI", "CoreWeave"
];

const IT_STRATEGY = [
    "Gartner", "Forrester", "IDC", "Accenture", "McKinsey Digital", 
    "Deloitte Digital", "BCG X", "PwC", "Bain & Company", "Infosys", 
    "TCS", "Wipro", "Capgemini", "Oracle", "SAP", 
    "Salesforce", "ServiceNow", "Cisco", "HPE", "Dell Technologies", 
    "Broadcom", "Red Hat", "Intel", "AMD", "Snowflake"
];

async function main() {
    console.log("Seeding Watchlist...");
    
    // Clear existing data
    await prisma.watchlist.deleteMany({});
    
    // AI Companies
    const top15AI = AI_COMPANIES.slice(0, 15);
    for (let i = 0; i < top15AI.length; i++) {
        await prisma.watchlist.upsert({
            where: { name: top15AI[i] },
            update: { category: "AI Companies", marketRank: i + 1 },
            create: { name: top15AI[i], category: "AI Companies", marketRank: i + 1, lastUpdate: new Date() }
        });
    }

    // IT Strategy
    const top15IT = IT_STRATEGY.slice(0, 15);
    for (let i = 0; i < top15IT.length; i++) {
        await prisma.watchlist.upsert({
            where: { name: top15IT[i] },
            update: { category: "IT Strategy", marketRank: i + 1 },
            create: { name: top15IT[i], category: "IT Strategy", marketRank: i + 1, lastUpdate: new Date() }
        });
    }
    
    console.log("Watchlist seeding complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
