import express from "express";
import path from "path";

const app = express();

// Serve your built frontend files
app.use(express.static(path.join(__dirname, "../dist/public")));

// Healthcheck
app.get("/", (req, res) => {
  res.send("Server is alive!");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
