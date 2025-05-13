const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const multer = require("multer");
const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");

const indexRouter = require("./routes/index");

const app = express();
const upload = multer({ dest: "uploads/" });

// 뷰 엔진 설정
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);

// ✅ /upload: 파일 받기 + Colab에 전달 + base64 렌더링
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

      // 사용자 입력 이미지 → base64
      const base64User = fs.readFileSync(userPath, "base64");
      const base64Style = fs.readFileSync(stylePath, "base64");
      const base64Color = fs.readFileSync(colorPath, "base64");

      // Colab 서버로 요청 보내기
      const form = new FormData();
      form.append("user", fs.createReadStream(userPath));
      form.append("style", fs.createReadStream(stylePath));
      form.append("color", fs.createReadStream(colorPath));

      const response = await axios.post(
        "https://703d-35-227-18-11.ngrok-free.app/generate", // 최신 ngrok 주소로 교체 필요
        form,
        {
          headers: form.getHeaders(),
          responseType: "arraybuffer",
        }
      );

      // 결과 이미지 받아서 base64로 변환
      const imageBuffer = response.data;
      const base64Image = imageBuffer.toString("base64");

      // 결과 페이지 렌더링
      res.render("result", {
        base64User,
        base64Style,
        base64Color,
        base64Image,
      });
    } catch (err) {
      console.error("❌ Colab 서버 호출 실패:", err.message);
      console.error(err.response?.data || err);
      res.status(500).send("서버 오류");
    }
  }
);

// 404 처리
app.use(function (req, res, next) {
  next(createError(404));
});

// 에러 핸들러
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

const port = 3000;
app.listen(port, () => {
  console.log(`✅ Express 서버 실행 중: http://localhost:${port}`);
});

module.exports = app;
