import path from 'path';
const express = require('express');
const ejs = require('EJS');

const app = express();
app.set('port', 3000);

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req:any, res:any) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(app.get('port'), 
    ()=>console.log( '[server] http://localhost:' + app.get('port')));