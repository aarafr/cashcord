import express from "express";
import ejs from "ejs";

const app = express();

app.use(express.static("public"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.set("port", 3000);
app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.type("text/html");
  res.send("<h1>index</h1>");
});

app.get("/vergelijk-tool", (req, res) => {
  let userHistory: any = [
    {
      date: new Date(2023, 3, 27),
      name: "ARTESIS PLANTIJN HOGESCHOOL ANTWERPEN",
      number: "0535880359",
      adress: "Lange Nieuwstraat, 101 , 2000, Antwerpen",
    },
    {
      date: new Date(2023, 3, 26),
      name: "ARTESIS PLANTIJN HOGESCHOOL ANTWERPEN",
      number: "0535880359",
      adress: "Lange Nieuwstraat, 101 , 2000, Antwerpen",
    },
    {
      date: new Date(2023, 3, 25),
      name: "ARTESIS PLANTIJN HOGESCHOOL ANTWERPEN",
      number: "0535880359",
      adress: "Lange Nieuwstraat, 101 , 2000, Antwerpen",
    },
    {
      date: new Date(2023, 3, 24),
      name: "ARTESIS PLANTIJN HOGESCHOOL ANTWERPEN",
      number: "0535880359",
      adress: "Lange Nieuwstraat, 101 , 2000, Antwerpen",
    },
  ];
  res.render("vergelijk-tool", {
    userHistory: userHistory,
  });
});

app.post("/vergelijk-tool", (req, res) => {
  let data = req.body;
  let companyNumber1 = req.body.company1;
  let companyNumber2 = req.body.company2;
  const test = async (company1: number, company2: number) => {};
});

app.listen(app.get("port"), () => {
  console.log(`SERVER: http://localhost:${app.get("port")}`);
});
