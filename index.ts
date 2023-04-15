import express from "express";
import path from "path";

const app = express();

app.set("port", 3000);

app.use(express.static('public'));
app.use('/', express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.get("/", (req:any, res:any) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("/compare", (req:any, res:any) => {
    res.sendFile(path.join(__dirname, 'public', 'compare.html'));
});

app.listen(app.get("port"), () =>
  console.log("[server] http://localhost:" + app.get("port"))
);