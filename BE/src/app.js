require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT;
const userRouter = require('./router/user');

require('./DB/db');

app.use(express.json());

app.use(userRouter);


app.listen(PORT, () => {
    console.log(`Server is lstenining on port ${PORT}`);
});