import path from "path";
import express, { response } from "express";
import { MongoClient, ObjectId } from "mongodb";
import session from "express-session";
import nocache from "nocache";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

const bodyParser = require("body-parser"); // npm install body-parser

dotenv.config();
// const { body, validationResult } = require('express-validator'); // npm install express-validator

declare module "express-session" {
  interface SessionData {
    loggedIn: Boolean;
    user: User;
  }
}

interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  password?: string;
}

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
    cookie: { maxAge: 3600000 },
  })
);
app.use(nocache());

app.get("/", (req, res) => {
  if (req.session.loggedIn) {
    return res.render("landing", { path: req.path, loggedIn: true, user: req.session.user });
  }
  res.render("landing", { path: req.path, loggedIn: false });
});

app.get("/cashcord", (req, res) => {
  if (req.session.loggedIn) {
    return res.render("index", { path: req.path, loggedIn: true, user: req.session.user });
  }
  res.redirect("/aanmelden?status=nietAangemeld");
});

app.get("/aanmelden", (req, res) => {
  if (req.session.loggedIn) {
    return res.redirect("/");
  } else if (req.query.status === "nietAangemeld") {
    return res.render("aanmelden", {
      path: req.path,
      status: {
        type: "error",
        message: "Aanmelding vereist",
      },
    });
  } else {
    res.render("aanmelden", { path: req.path });
  }
});

app.post("/aanmelden", async (req, res) => {
  const email = req.body.email.replace(/\s+/g, "");
  const password = req.body.password;
  let user = await client.db("cashcord").collection("users").findOne({ email: email });

  if (user !== null) {
    bcrypt.compare(password, user.password, function (err: any, result: any) {
      if (result) {
        req.session.loggedIn = true;
        req.session.user = {
          _id: user?._id,
          name: user?.name,
          email: user?.email,
        };
        return res.redirect("/?status=aangemeld");
      } else {
        return res.render("aanmelden", {
          path: req.path,
          status: {
            type: "error",
            message: "Onjuist emailadres of wachtwoord",
          },
        });
      }
    });
  } else {
    res.render("aanmelden", {
      path: req.path,
      status: {
        type: "error",
        message: "Onjuist emailadres of wachtwoord",
      },
    });
  }
});

app.post("/registreren", async (req, res) => {
  console.log(req.body);
  const name = req.body.firstname + " " + req.body.lastname;
  const email = req.body.email.replace(/\s+/g, "");
  const password = req.body.password;
  const passwordRepeat = req.body.passwordRepeat;

  const nameMatch = /^[a-zA-Z ]+$/;
  const mailMatch = /^[a-zA-Z0-9.]+@[a-zA-Z]+\.[a-zA-Z]{2,3}$/;
  const passMatch = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#?$%^&*]).{8,}$/;

  if (!name.match(nameMatch)) {
    return res.render("registreren", {
      path: req.path,
      status: {
        message: "De ingevoerde naam is ongeldig",
      },
    });
  }
  if (!email.match(mailMatch)) {
    return res.render("registreren", {
      path: req.path,
      status: {
        type: "error",
        message: "Het ingevoerde email adres is ongeldig",
      },
    });
  }
  if (password !== passwordRepeat) {
    return res.render("registreren", {
      path: req.path,
      status: {
        type: "error",
        message: "De ingevoerde wachtwoorden zijn niet gelijk",
      },
    });
  }
  if (!password.match(passMatch)) {
    return res.render("registreren", {
      path: req.path,
      status: {
        type: "error",
        message:
          "Je wachtwoord moet minimaal 8 tekens bevatten, waarvan minstens 1 cijfer, 1 kleine letter, 1 hoofdletter en minstens 1 van deze karakters !@#$%^&*",
      },
    });
  }

  if ((await client.db("cashcord").collection("users").findOne({ email: email })) === null) {
    bcrypt.hash(password, saltRounds, async (err: any, hash: string) => {
      const userObj: User = {
        name: name,
        email: email,
        password: hash,
      };
      client.db("cashcord").collection("users").insertOne(userObj);
      req.session.loggedIn = true;
      req.session.user = userObj;
      return res.redirect("/?status=geregistreerd");
    });
  } else {
    res.render("registreren", {
      path: req.path,
      status: {
        type: "error",
        message: "Een gebruiker met dit emailadres bestaat al",
      },
    });
  }
});

app.get("/registreren", (req, res) => {
  if (req.session.loggedIn) {
    return res.redirect("/");
  }
  res.render("registreren", { path: req.path });
});

app.get("/afmelden", (req, res) => {
  if (req.session.loggedIn) {
    req.session.destroy((err) => {});
    return res.redirect("/?status=afgemeld");
  }
  res.redirect("/");
});

app.get("/cashcord/vergelijk", (req, res) => {
  if (req.session.loggedIn) {
    return res.render("vergelijk", { path: req.path, loggedIn: true, user: req.session.user });
  }
  res.redirect("/aanmelden?status=nietAangemeld");
});

app.post("/cashcord/vergelijk", async (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect("/aanmelden?status=nietAangemeld");
  }
  const ondernemingsnummer1: string = req.body.ondernemingsnummer1;
  const ondernemingsnummer2: string = req.body.ondernemingsnummer2;
  const ondernemingsnummerRegex = /^[0-9]{9}$/;
  if (
    !ondernemingsnummer1.match(ondernemingsnummerRegex) ||
    !ondernemingsnummer2.match(ondernemingsnummerRegex)
  ) {
    return res.render("vergelijk", {
      path: req.path,
      status: {
        type: "error",
        message: "Ongeldige ondernemingsnummer(s). Een ondernemingsnummer bestaat uit 9 cijfers",
      },
    });
  }
  const onderneming1: any = await apiFetch(
    "http://localhost:3000/assets/example-api-response.json"
  );
  const onderneming2: any = await apiFetch(
    "http://localhost:3000/assets/example-api-response.json"
  );
  if (onderneming1 === 404 || onderneming2 === 404) {
    return res.render("vergelijk", {
      path: req.path,
      status: {
        type: "error",
        message: "Ongeldige ondernemingsnummer(s)",
      },
      loggedIn: true,
      user: req.session.user,
    });
  }
  res.render("vergelijk", {
    path: req.path,
    onderneming1,
    onderneming2,
    loggedIn: true,
    user: req.session.user,
  });
});

const apiFetch = async (url: string) => {
  const config: AxiosRequestConfig = {
    method: "get",
    headers: {
      "X-Request-Id": uuidv4(),
      "NBB-CBSO-Subscription-Key": process.env.API_KEY,
      Accept: "application/json",
    },
  };
  return await axios
    .get(url, config)
    .then((response) => response.data)
    .catch((e) => e.response.status);
};

app.get("/pokemon", (req, res) => {
  if (req.session.loggedIn) {
    return res.redirect("/?status=geenToegang");
  }
  res.redirect("/aanmelden?status=nietAangemeld");
});

app.get("/fortnite", (req, res) => {
  if (req.session.loggedIn) {
    return res.redirect("/?status=geenToegang");
  }
  res.redirect("/aanmelden?status=nietAangemeld");
});

app.get("/mtg", (req, res) => {
  if (req.session.loggedIn) {
    return res.redirect("/?status=geenToegang");
  }
  res.redirect("/aanmelden?status=nietAangemeld");
});

app.get("/fifa", (req, res) => {
  if (req.session.loggedIn) {
    return res.redirect("/?status=geenToegang");
  }
  res.redirect("/aanmelden?status=nietAangemeld");
});

app.get("/lotr", (req, res) => {
  if (req.session.loggedIn) {
    return res.redirect("/?status=geenToegang");
  }
  res.redirect("/aanmelden?status=nietAangemeld");
});

app.get("/lego-masters", (req, res) => {
  if (req.session.loggedIn) {
    return res.redirect("/?status=geenToegang");
  }
  res.redirect("/aanmelden?status=nietAangemeld");
});

app.use((req, res, next) => {
  res.status(404).render("404");
});

app.listen(app.get("port"), async () => {
  await connect();
  console.log("[server] http://localhost:" + app.get("port"));
});
