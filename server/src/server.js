require("dotenv").config();

const app = require("./app");
const prisma = require("./config/prisma");

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - start;
    console.log(`Database connected successfully (${duration}ms)`);
  } catch (error) {
    console.error(`Database connection check failed: ${error.message}`);
  }
});
