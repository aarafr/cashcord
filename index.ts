import path from "path";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

interface User {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const bcrypt = require("bcrypt");
const express = require("express");
const ejs = require("EJS");

const saltRounds = 10;

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

const db = client.db("cashcoard");
const app = express();

app.set("port", 3000);
app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: any, res: any) => {
  res.render("home");
});

app.get("/login", async (req: any, res: any) => {
  res.render("login");
});

app.post("/login", async (req: any, res: any) => {
  const email = req.body.email;
  const password = req.body.psw;

  const hash = await db.collection("users").findOne({ email: email });

  if (hash !== null) {
    bcrypt.compare(password, hash.password, function (err: any, result: any) {
      if (result) {
        res.redirect("/vergelijken");
      } else {
        res.redirect("?status=wrongPassword");
      }
    });
  } else {
    res.redirect("?status=emailNotFound");
  }
});

app.get("/registreer", async (req: any, res: any) => {
  res.render("register");
});

app.post("/registreer", async (req: any, res: any) => {
  const firstName: string = req.body.firstName;
  const lastName: string = req.body.lastName;
  const password: string = req.body.psw;
  const email: string = req.body.email;

  if ((await db.collection("users").findOne({ email: email })) === null) {
    bcrypt.hash(password, saltRounds, async (err: any, hash: string) => {
      await db.collection("users").insertOne({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: hash,
      });
    });
    res.redirect("?status=succeed");
  } else {
    res.redirect("?status=userExists");
  }
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
