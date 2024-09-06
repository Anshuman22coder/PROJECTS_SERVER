const express =require("express");
const path=require("path");
const app=express();
const formidable=require("formidable");
const axios=require("axios")
const fs = require('fs');
const FormData = require('form-data');
const cors = require('cors');
app.use(cors());

const port=3000;


//serve static files from the "public " directory
app.use(express.static(path.join(__dirname,"public")));



app.get('/', (req, res) => {
  res.send(`
      <form action="/upload" method="post" enctype="multipart/form-data">
          <input type="file" name="screenshots" multiple><br>
          <button type="submit">Upload</button>
      </form>
  `);
});

app.get("//",(req,res)=>
{    //used for linking the html files to the server side...
  res.sendFile(path.join(__dirname,"public","index.html"));
});


app.post("/upload",(req,res)=>{    //on upload request , this will get executed..
   const form=  new formidable.IncomingForm();
   //parse the incomming file and fields
   form.parse(req,(err,fields,files)=>
  {
    if(err)
      return res.status(400).json({
    error:"error parsing "});
  

  //accessing the upload files
  const uploadedFiles=files.screenshots;  //access the "screenschots fields"
  console.log("upload files:",uploadedFiles);
  // Send the files to the LLM API for processing
  sendFilesToLLM(uploadedFiles)
  .then(responseFromLLM => {
      // Send the LLM's response back to the client
      res.status(200).json({
          message: 'Files uploaded and processed successfully',
          llmResponse: responseFromLLM
      });
  })
  .catch(error => {
      res.status(500).json({ error: 'Error processing the files with LLM', details: error });
  });
});
});


// Function to send files to the LLM API for processing
async function sendFilesToLLM(files) {
  const formData = new FormData();

  // Check if multiple files were uploaded and append each file to formData
  if (Array.isArray(files)) {
      files.forEach((file) => {
          formData.append('files', fs.createReadStream(file.path));
      });

      //same as before..
     /* if(Array.isArray(files)){
        for(let i=0;i<files.length;i++)
        {
          formData.append("files",fs.createReadStream(files[i].path));
        }
      }*/
  } else {
      // Single file upload
      formData.append('files', fs.createReadStream(files.path));
  }

  try {
      // Replace with your actual LLM API endpoint
      const response = await axios.post('https://api.openai.com/v1/completions', formData, {
          
       headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': 'Bearer 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',  // Use your API key
          },
          data: {
            model: 'gpt-4',  // Adjust based on your LLM model
            prompt: 'Generate testing instructions based on the provided screenshots and context.',
            max_tokens: 1500
        }
      });

      // Return the LLM's response (e.g., test instructions)
      return response.data;
  } catch (error) {
      console.error('Error sending files to LLM:', error);
      throw error;
  }
}



app.listen(port,()=>
{
  console.log("server running at port 3000");
});