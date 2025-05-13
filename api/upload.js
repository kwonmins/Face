import formidable from "formidable";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

// Next.js API 라우트에서 BodyParser 비활성화 (formidable이 대신 처리함)
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).send("폼 처리 오류");
    }

    try {
      const formData = new FormData();
      formData.append("user", fs.createReadStream(files.user[0].filepath));
      formData.append("style", fs.createReadStream(files.style[0].filepath));
      formData.append("color", fs.createReadStream(files.color[0].filepath));

      const response = await axios.post(
        "https://d8f4-35-227-18-11.ngrok-free.app", // ngrok 주소로 바꿔주세요
        formData,
        {
          headers: formData.getHeaders(),
          responseType: "arraybuffer",
        }
      );

      res.setHeader("Content-Type", "image/png");
      res.status(200).send(response.data);
    } catch (error) {
      console.error("Colab 호출 실패:", error.message);
      res.status(500).send("Colab 서버 호출 실패");
    }
  });
}
