const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const app = express(); // ✅ MAKE SURE THIS COMES FIRST
app.use(cors());

// 🔁 Route 1: Get parsed data for one stock
app.get("/api/stock/:symbol", (req, res) => {
  const { symbol } = req.params;
  const filePath = path.join(__dirname, "data", `${symbol.toUpperCase()}.csv`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Stock data not found" });
  }

  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => results.push(row))
    .on("end", () => res.json(results));
});

// 🔁 Route 2: Get list of all available stock CSVs
app.get("/api/stocks", (req, res) => {
  const dataDir = path.join(__dirname, "data");

  fs.readdir(dataDir, (err, files) => {
    if (err) {
      console.error("Failed to read stock list:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    const symbols = files
      .filter((file) => file.endsWith(".csv"))
      .map((file) => path.basename(file, ".csv").toUpperCase());

    res.json(symbols);
  });
});

// 🔁 Start server
app.listen(5000, () => {
  console.log("✅ Backend server running at http://localhost:5000");
});
