import knex from "./src/config/connection";

async function checkCities() {
    try {
        const cities = await knex("common.cities")
            .select("id", "name")
            .limit(10);
        console.log("Cities found:", JSON.stringify(cities, null, 2));
    } catch (e: any) {
        console.error("DB Error:", e.message);
    } finally {
        await knex.destroy();
    }
}

checkCities();
