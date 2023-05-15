import path from "path";
import express from "express";
import { MongoClient, ObjectId } from "mongodb";
const bodyParser = require("body-parser"); // npm install body-parser
import session from "express-session";

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

const uri = `mongodb+srv://nodejs_user:oGerFp37BHztuXWX@cluster0.ubsbpv8.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

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
    cookie: { maxAge: 86400 },
  })
);

app.get("/", (req, res) => {
  res.type("text/html");
  res.render("landing", { path: req.path });
});
app.get("/home", (req, res) => {
  res.type("text/html");
  res.render("index", { path: req.path });
});

app.get("/login", (req, res) => {
  if (req.session.loggedIn) {
    res.status(200);
    res.redirect("/projecten");
  } else {
    res.type("text/html");
    res.render("login", { path: req.path });
  }
});

app.post("/login", async (req, res) => {
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
        res.redirect("/projecten");
      } else {
        return res.render("login", {
          path: req.path,
          loginError: {
            message: "Onjuist emailadres of wachtwoord",
          },
        });
      }
    });
  } else {
    return res.render("login", {
      path: req.path,
      loginError: {
        message: "Onjuist emailadres of wachtwoord",
      },
    });
  }
});

app.post("/signup", async (req, res) => {
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
      res.status(200);
      res.redirect("/projecten");
    });
  } else {
    res.render("signup", {
      path: req.path,
      loginError: {
        message: "Een gebruiker met dit emailadres bestaat al",
      },
    });
  }
});

app.get("/signup", (req, res) => {
  if (req.session.loggedIn) {
    res.status(200);
    res.redirect("/projecten");
  }
  res.type("text/html");
  res.render("signup", { path: req.path });
});

app.get("/logout", (req, res) => {
  if (req.session.loggedIn) {
    req.session.destroy((err) => {});
  }
  res.redirect("/");
});

app.get("/projecten", (req, res) => {
  if (req.session.loggedIn) {
    res.render("landing", {
      path: req.path,
      user: req.session.user,
    });
  } else {
    res.status(200);
    res.redirect("/login?status=notLoggedIn");
  }
});

app.get("/compare", (req, res) => {
  if (req.session.loggedIn) {
    res.type("text/html");
    res.render("compare", { path: req.path });
  } else {
    res.status(200);
    res.redirect("/login?status=notLoggedIn");
  }
});

app.use((req, res, next) => {
  res.status(404).render("404");
});

app.listen(app.get("port"), async () => {
  await connect();
  console.log("[server] http://localhost:" + app.get("port"));
});
