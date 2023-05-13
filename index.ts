import path from "path";
import express from "express";
import { MongoClient } from "mongodb";
const bodyParser = require("body-parser"); // npm install body-parser
const session = require("express-session");
// const { body, validationResult } = require('express-validator'); // npm install express-validator

interface User {
  name: string;
  email: string;
  password: string;
}

let userArray: User[] = [];

let MongoPassword = encodeURIComponent("hhfrp132545ppokhh1");
const url = `mongodb+srv://nodejs_user:NAgARzje8W6aosBL@cluster0.tzj4rtf.mongodb.net/?retryWrites=true&w=majority`;
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
app.use(
  session({
    secret: "XtjnbAymL5hoan1nw8dWqbKzhQu3GvAlvdNAo0XPh8EHetasKN",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 86400 },
  })
);

app.get("/", (req, res) => {
  res.type("text/html");
  res.render("index", { path: req.path });
});

app.get("/login", (req, res) => {
  if (session.loggedIn) {
    res.status(200);
    res.redirect("/projecten");
  }
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
  bcrypt.hash(password, saltRounds, async (err: any, hash: string) => {
    const userObj: User = {
      name: name,
      email: email,
      password: hash,
    };
    data(userObj);
    console.log(userObj);
    session.loggedIn = true;
    session.user = userObj;
    res.status(200);
    res.redirect("/projecten");
  });
});

app.get("/signup", (req, res) => {
  if (session.loggedIn) {
    res.status(200);
    res.redirect("/projecten");
  }
  res.type("text/html");
  res.render("signup", { path: req.path });
});

app.get("/logout", (req, res) => {
  if (session.loggedIn) {
    res.status(200);
    res.redirect("/?status=loggedOut");
  } else {
    res.redirect("/");
  }
});

app.get("/projecten", (req, res) => {
  if (session.loggedIn) {
    res.render("landing", {
      path: req.path,
      user: session.user,
    });
  } else {
    res.status(200);
    res.redirect("/login?status=notLoggedIn");
  }
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

app.use((req, res, next) => {
  res.status(404).render("404");
});

app.listen(app.get("port"), () => console.log("[server] http://localhost:" + app.get("port")));
