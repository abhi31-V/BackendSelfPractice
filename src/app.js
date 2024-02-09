import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"
const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"})) // as in url sometimes data become not usable jo we used this middleware
app.use(express.static("public"))
app.use(cookieParser());



//routes  imports
import userRouter from "./routes/user.routes.js";


//routes declare for middleware so we use (prefix routes)
app.use("/api/v1/users",userRouter)

//http://localhost:8000/api/v1/users/register
export {app};