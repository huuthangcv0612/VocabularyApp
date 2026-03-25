const express = require("express");
const cors = require("cors");
const sql = require("mssql");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// serve ảnh
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const config = {
  user: "thang",
  password: "1",
  server: "localhost",
  database: "VocabularyApp",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// upload ảnh
const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

let pool;

async function getPool() {
  if (pool) return pool;
  pool = await sql.connect(config);
  console.log("✅ Kết nối DB thành công");
  return pool;
}

function handleDbError(res, err, context) {
  console.error(`DB error (${context}):`, err);
  res.status(500).json({ error: "Internal server error" });
}

// ================= API =================

// lấy toàn bộ level
app.get("/levels", async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query("SELECT * FROM Levels");
    res.json(result.recordset);
  } catch (err) {
    handleDbError(res, err, "/levels");
  }
});

// lấy lektion theo level
app.get("/lektions/:levelId", async (req, res) => {
  try {
    const p = await getPool();
    const result = await p
      .request()
      .input("levelId", sql.Int, req.params.levelId)
      .query("SELECT * FROM Lektions WHERE level_id = @levelId");

    res.json(result.recordset);
  } catch (err) {
    handleDbError(res, err, "/lektions/:levelId");
  }
});

// lấy vocab theo lektion
app.get("/vocab/:lektionId", async (req, res) => {
  try {
    const p = await getPool();
    const result = await p
      .request()
      .input("lektionId", sql.Int, req.params.lektionId)
      .query("SELECT * FROM Vocabularies WHERE lektion_id = @lektionId");

    res.json(result.recordset);
  } catch (err) {
    handleDbError(res, err, "/vocab/:lektionId");
  }
});

// thêm vocab + ảnh
app.post("/vocab", upload.single("image"), async (req, res) => {
  try {
    const { word, meaning, lektion_id } = req.body;
    const image_url = `/uploads/${req.file.filename}`;

    const p = await getPool();
    await p
      .request()
      .input("word", sql.NVarChar, word)
      .input("meaning", sql.NVarChar, meaning)
      .input("image_url", sql.NVarChar, image_url)
      .input("lektion_id", sql.Int, lektion_id)
      .query(`
        INSERT INTO Vocabularies (word, meaning, image_url, lektion_id)
        VALUES (@word, @meaning, @image_url, @lektion_id)
      `);

    res.send("OK");
  } catch (err) {
    handleDbError(res, err, "/vocab (POST)");
  }
});

app.post("/grammar-check", async (req, res) => {
  try {
    const { sentence, language = "de-DE" } = req.body;
    if (!sentence || sentence.trim().length === 0) {
      return res.status(400).json({ error: "sentence is required" });
    }

    const params = new URLSearchParams();
    params.append("text", sentence);
    params.append("language", language);
    params.append("enabledOnly", "false");

    const ltRes = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!ltRes.ok) {
      const text = await ltRes.text();
      throw new Error(`LanguageTool lỗi: ${ltRes.status} ${text}`);
    }

    const result = await ltRes.json();

    // Loại trùng bằng key message+offset+length+ruleId
    const keySet = new Set();
    const rawChecks = (result.matches || [])
      .map((m) => {
        const ruleId = m.rule ? m.rule.id : null;
        const key = `${m.message}|${m.offset}|${m.length}|${ruleId}`;
        return { raw: m, key, ruleId };
      })
      .filter(({ key }) => {
        if (keySet.has(key)) return false;
        keySet.add(key);
        return true;
      })
      .map(({ raw }) => raw);

    const translateMessage = (message) => {
      const map = {
        "Possible spelling mistake found.": "Phát hiện có thể là lỗi chính tả.",
        "Möglicher Tippfehler gefunden.": "Phát hiện có thể là lỗi chính tả.",
        "Ein Vorschlag zur Verbesserung des Stils.": "Đề xuất cải thiện phong cách.",
        "Ist dies ein doppeltes Wort?": "Có phải là từ lặp không?",
      };
      return map[message] || message;
    };

    const checks = rawChecks.map((m) => ({
      message: m.message,
      message_vi: translateMessage(m.message),
      offset: m.offset,
      length: m.length,
      context: m.context ? m.context.text : "",
      replacements: (m.replacements || []).map((r) => r.value),
      ruleId: m.rule ? m.rule.id : null,
      category: m.rule ? m.rule.issueType : null,
    }));

    let suggestedSentence = sentence;
    const replaceables = checks
      .filter((c) => c.replacements.length > 0)
      .sort((a, b) => b.offset - a.offset);

    for (const check of replaceables) {
      if (check.offset >= 0 && check.offset + check.length <= suggestedSentence.length) {
        suggestedSentence =
          suggestedSentence.slice(0, check.offset) +
          check.replacements[0] +
          suggestedSentence.slice(check.offset + check.length);
      }
    }

    res.json({
      sentence,
      language,
      errorCount: checks.length,
      checks,
      isValid: checks.length === 0,
      suggestedSentence,
    });
  } catch (error) {
    console.error("grammar-check error:", error);
    res.status(500).json({ error: error.message || "Internal error" });
  }
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log("Server chạy cổng" + PORT));