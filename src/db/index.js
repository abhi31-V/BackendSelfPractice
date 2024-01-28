import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectDB = async() =>{
    try{
const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
console.log("Db connected at", connectionInstance.connection.host)
    }
    catch(err){
        console.log("Connection Failed",err);
        process.exit(1);
       // it's exit the current process if application crash
    }
}
export default connectDB;