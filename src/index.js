//require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from "./db/db.js";

dotenv.config({
    path: './env'
})


connectDB()
















/*
import express from "express"
const app = express()
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODM_URI}/$
         {DB_NAME}`)
         app.on("error", () => {
            console.log("ERRR: ", error);
            throw error
         })

         app.listen(process.env.PORT, () => {
            console.log(`App is listening on part $ 
            {process.env.PORT}`);
         })

    } catch (error) {
        console.error("ERROR: ", error)
        throw err
    }
})()
*/