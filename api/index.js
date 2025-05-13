const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const FormData = require("form-data");
const axios = require("axios");
const ejs = require("ejs");
const app = express();
const upload = multer({ dest: "/tmp" }); // Lambda 환경은 /tmp만 씀

app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.render("index"); // 또는 upload 폼 페이지
});

app.post(
  "/upload",
  upload.fields([
    { name: "user" },
    { name: "style" },
    { name: "color" },
  ]),
  async (req, res) => {
    try {
      const userPath = req.files["user"][0].path;
      const stylePath = req.files["style"][0].path;
      const colorPath = req.files["color"][0].path;

      const base64User = fs.readFileSync(userPath, "base64");
      const base64Style = fs.readFileSync(stylePath, "base64");
      const base64Color = fs.readFileSync(colorPath, "base64");

      const form = new FormData();
      form.append("user", fs.createReadStream(userPath));
      form.append("style", fs.createReadStream(stylePath));
      form.append("color", fs.createReadStream(colorPath));

      const response = await axios.post(
        "https://YOUR-NGROK-NODE/generate",
        form,
        {
          headers: form.getHeaders(),
          responseType: "arraybuffer",
        }
      );

      const base64Image = response.data.toString("base64");

      res.render("result", {
        base64User,
        base64Style,
        base64Color,
        base64Image,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("오류 발생");
    }
  }
);

module.exports = app;
