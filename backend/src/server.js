const app = require("./app");
const connectDatabase = require("./index");

const PORT = process.env.PORT || 3000;

async function main() {
    try {
        await connectDatabase();
        app.listen(PORT, () => {
            console.log(`Backend running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error.message);
        process.exit(1);
    }
}

main();