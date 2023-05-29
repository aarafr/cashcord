import path from "path";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import session from "express-session";
import nocache from "nocache";
import dotenv from "dotenv";
import { getReferences, getReference, getAccountingData, getAccountingDataPdf } from "./getData";

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
  const ondernemingsnummerRegex = /^[0-9]{9,10}$/;

  if (
    !ondernemingsnummer1.match(ondernemingsnummerRegex) ||
    !ondernemingsnummer2.match(ondernemingsnummerRegex)
  ) {
    return res.render("vergelijk", {
      path: req.path,
      ondernemingsnummer1,
      ondernemingsnummer2,
      status: {
        color: "#ff0f0f",
        message: "Ongeldige ondernemingsnummer(s)",
      },
    });
  }

  const references1 = await getReferences(ondernemingsnummer1);
  const references2 = await getReferences(ondernemingsnummer2);

  if (references1 === 404 || references1 === 400 || references2 === 404 || references2 === 400) {
    return res.render("vergelijk", {
      path: req.path,
      ondernemingsnummer1,
      ondernemingsnummer2,
      status: {
        color: "#ff0f0f",
        message: "Ondernemingsnummer(s) werd niet gevonden door de Balanscentrale.",
      },
    });
  }

  if (req.body.references1 && req.body.references2) {
    const reference1 = await getReference(req.body.references1);
    const reference2 = await getReference(req.body.references2);

    if (reference1 === 404 || reference2 === 404) {
      return res.render("vergelijk", {
        path: req.path,
        ondernemingsnummer1,
        ondernemingsnummer2,
        status: {
          color: "#ff0f0f",
          message: "Ongeldige referte(s)",
        },
      });
    }

    const accoutingData1 = await getAccountingData(reference1.ReferenceNumber);
    const accoutingData2 = await getAccountingData(reference2.ReferenceNumber);

    interface accountDataObj {
      eigenVermogen: string;
      schulden: string;
      bedrijfswinstBedrijfsverlies: string;
      isWinst: boolean;
    }

    let accountDataObj1: accountDataObj = null!;
    let accountDataObj2: accountDataObj = null!;

    if (accoutingData1.status !== 404) {
      const eigenVermogen = parseInt(
        accoutingData1.Rubrics.find((obj: any) => obj.Code === "10/15").Value
      ).toLocaleString("nl-BE");
      const schulden = parseInt(
        accoutingData1.Rubrics.find((obj: any) => obj.Code === "42/48").Value
      ).toLocaleString("nl-BE");
      const bedrijfswinstBedrijfsverlies = parseInt(
        accoutingData1.Rubrics.find((obj: any) => obj.Code === "9901").Value
      ).toLocaleString("nl-BE");
      const isWinst = parseInt(bedrijfswinstBedrijfsverlies) > 0;
      accountDataObj1 = {
        eigenVermogen,
        schulden,
        bedrijfswinstBedrijfsverlies,
        isWinst,
      };
    }
    if (accoutingData2.status !== 404) {
      const eigenVermogen = parseInt(
        accoutingData2.Rubrics.find((obj: any) => obj.Code === "10/15").Value
      ).toLocaleString("nl-BE");
      const schulden = parseInt(
        accoutingData2.Rubrics.find((obj: any) => obj.Code === "42/48").Value
      ).toLocaleString("nl-BE");
      const bedrijfswinstBedrijfsverlies = parseInt(
        accoutingData2.Rubrics.find((obj: any) => obj.Code === "9901").Value
      ).toLocaleString("nl-BE");
      const isWinst = parseInt(bedrijfswinstBedrijfsverlies) > 0;
      accountDataObj2 = {
        eigenVermogen,
        schulden,
        bedrijfswinstBedrijfsverlies,
        isWinst,
      };
    }

    return res.render("vergelijk", {
      path: req.path,
      ondernemingsnummer1,
      ondernemingsnummer2,
      reference: {
        reference1,
        reference2,
      },
      accoutingData: {
        accoutingData1: accountDataObj1,
        accoutingData2: accountDataObj2,
      },
      loggedIn: true,
      user: req.session.user,
    });
  } else {
    return res.render("vergelijk", {
      path: req.path,
      ondernemingsnummer1,
      ondernemingsnummer2,
      references: {
        references1,
        references2,
      },
      status: {
        color: "#198754",
        message: "Selecteer het jaar van neerlegging",
      },
      loggedIn: true,
      user: req.session.user,
    });
  }
});

app.get("/cashcord/vergelijk/pdf", async (req, res) => {
  const referenceNumber = req.query.referenceNumber;
  if (typeof referenceNumber === "string") {
    res.contentType("application/pdf").send(await getAccountingDataPdf(referenceNumber));
  }
});

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
