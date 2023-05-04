import path from "path";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

const express = require("express");
const ejs = require("EJS");

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI!);

const exit = async () => {
  try {
    await client.close();
    console.log("Disconnected from database");
  } catch (error) {
    console.error(error);
  }
  process.exit(0);
};

const connect = async () => {
  try {
    await client.connect();
    console.log("Connected to database");
    process.on("SIGINT", exit);
  } catch (error) {
    console.error(error);
  }
};

const app = express();
app.set("port", 3000);
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req: any, res: any) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/login", async (req: any, res: any) => {
  res.render("login");
});

app.get("/registreer", async (req: any, res: any) => {
  res.render("register");
});

app.get("/wachtwoord-vergeten", async (req: any, res: any) => {
  res.render("forgot-password");
});

app.get("/projecten", async (req: any, res: any) => {
  res.render("projects");
});

app.get("/vergelijken", async (req: any, res: any) => {
  res.render("compare");
});

app.listen(app.get("port"), async () => {
  await connect();
  console.log("[server] http://localhost:" + app.get("port"));
});
