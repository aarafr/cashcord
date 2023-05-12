import path from "path";
import express from "express";
import { MongoClient } from "mongodb";
const bodyParser = require("body-parser"); // npm install body-parser
// const { body, validationResult } = require('express-validator'); // npm install express-validator

interface User {
  name: string;
  email: string;
  password: string;
}

let userArray: User[] = [];

let MongoPassword = encodeURIComponent("hhfrp132545ppokhh1");
const url = `mongodb+srv://Sidge:${MongoPassword}@cashcord.m5mpiy9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(url);

const app = express();
const bcrypt = require("bcrypt");
const saltRounds = 10;

app.use(bodyParser.urlencoded({ extended: true }));

// let api = "https://ws.uat2.cbso.nbb.be/authentic/legalEntity/0453488757";
// fetch(api)
//   .then(response => {
//     if(!response.ok){
//       throw new Error("Network issue");
//     }
//     return response.json;
//   })

app.set("port", 3000);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static("public"));
app.use("/", express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.type("text/html");
  res.render("index", { path: req.path });
});

app.get("/login", (req, res) => {
  res.type("text/html");
  res.render("login", { path: req.path });
});

app.post("/login", (req, res) => {
  const email = req.body.email.replace(/\s+/g, "");
  const password = req.body.password;
});

app.post("/signup", (req, res) => {
  console.log(req.body);
  const name = req.body.firstname + " " + req.body.lastname;
  const email = req.body.email.replace(/\s+/g, "");
  const password = req.body.password;
  const passwordRepeat = req.body.passwordRepeat;

  const nameMatch = /^[a-zA-Z ]+$/;
  const mailMatch = /^[a-zA-Z0-9.]+@[a-zA-Z]+\.[a-zA-Z]{2,3}$/;
  const passMatch = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;

  if (!name.match(nameMatch)) {
    return res.render("signup", {
      path: req.path,
      loginError: {
        message: "De ingevoerde naam is ongeldig",
      },
    });
  }
  if (!email.match(mailMatch)) {
    return res.render("signup", {
      path: req.path,
      loginError: {
        message: "Het ingevoerde email adres is ongeldig",
      },
    });
  }
  if (password !== passwordRepeat) {
    return res.render("signup", {
      path: req.path,
      loginError: {
        message: "De ingevoerde wachtwoorden zijn niet gelijk",
      },
    });
  }
  if (!password.match(passMatch)) {
    return res.render("signup", {
      path: req.path,
      loginError: {
        message:
          "Je wachtwoord moet minimaal 8 tekens bevatten, waarvan minstens 1 cijfer, 1 kleine letter, 1 hoofdletter en minstens 1 van deze karakters !@#$%^&*",
      },
    });
  }
  res.status(200);
  res.redirect("/");
  bcrypt.hash(password, saltRounds, async (err: any, hash: string) => {
    const userObj: User = {
      name: name,
      email: email,
      password: hash,
    };
    console.log(userObj);
    data(userObj);
  });
});

app.get("/signup", (req, res) => {
  res.type("text/html");
  res.render("signup", { path: req.path });
});

app.get("/compare", (req, res) => {
  res.type("text/html");
  res.render("compare", { path: req.path });
});

const data = async (userObj: User) => {
  try {
    await client.connect();
    console.log("connected to the database");

    userArray.push(userObj);

    let users: User[] = await client.db("cashcord").collection("users").find<User>({}).toArray();
    if (users.length == 0) {
      await client.db("cashcord").collection("users").insertMany(userArray);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
};

app.use(function (req, res, next) {
  res.status(404).render("404");
});

app.listen(app.get("port"), () => console.log("[server] http://localhost:" + app.get("port")));
