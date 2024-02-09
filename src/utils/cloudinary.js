import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET_KEY 
});


const uploadOnCloudinary = async (localFilePath) => {
  try {
      if (!localFilePath) return null;
      //upload the file on cloudinary
      const response = await cloudinary.uploader.upload(localFilePath===undefined?"": localFilePath, {
          resource_type: "auto"
      });
      console.log(response); // For debugging
      return response;
  } catch (error) {
      console.error(error); // For debugging
      return null;
  } finally {
    if (localFilePath) {
        fs.unlinkSync(localFilePath); // Remove the locally saved temporary file whether upload succeeded or failed
    }
}

};


  export {uploadOnCloudinary}