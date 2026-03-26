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

app.post("/analyze-sentence", async (req, res) => {
  try {
    const { sentence, targetWord } = req.body;
    if (!sentence || sentence.trim().length === 0) {
      return res.status(400).json({ error: "sentence is required" });
    }

    const params = new URLSearchParams();
    params.append("text", sentence);
    params.append("language", "de");
    params.append("enabledOnly", "false");

    const ltRes = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!ltRes.ok) {
      const text = await ltRes.text();
      throw new Error(`LanguageTool error: ${ltRes.status} ${text}`);
    }

    const result = await ltRes.json();

    // Process errors
    const errors = (result.matches || []).map((m) => {
      let type = "other";
      if (m.rule && m.rule.category) {
        const cat = m.rule.category.id;
        if (cat === "TYPOS") type = "spelling";
        else if (cat === "GRAMMAR") type = "grammar";
        else if (cat === "STYLE") type = "style";
        else if (cat === "PUNCTUATION") type = "punctuation";
        else if (cat === "COLLOQUIALISMS" || cat === "REDUNDANCY") type = "style";
      }

      const vietnameseExplanation = translateToVietnamese(m.message);

      return {
        type,
        message: m.message,
        vietnameseExplanation,
        suggestions: (m.replacements || []).map((r) => r.value),
        offset: m.offset,
        length: m.length,
      };
    });

    // Corrected sentence
    let correctedSentence = sentence;
    const replaceables = errors
      .filter((e) => e.suggestions.length > 0)
      .sort((a, b) => b.offset - a.offset);
    for (const err of replaceables) {
      if (err.offset >= 0 && err.offset + err.length <= correctedSentence.length) {
        correctedSentence =
          correctedSentence.slice(0, err.offset) +
          err.suggestions[0] +
          correctedSentence.slice(err.offset + err.length);
      }
    }

    // Target word analysis
    const targetWordAnalysis = analyzeTargetWord(sentence, targetWord, errors);

    // Analysis
    const analysis = {
      grammar: generateGrammarAnalysis(sentence, errors),
      vocabulary: generateVocabularyAnalysis(sentence, targetWord),
      sentenceStructure: generateStructureAnalysis(sentence),
    };

    // Feedback
    const feedback = generateFeedback(errors, targetWordAnalysis);

    res.json({
      sentence,
      correctedSentence,
      errors,
      analysis,
      feedback,
      targetWordAnalysis,
    });
  } catch (error) {
    console.error("analyze-sentence error:", error);
    res.status(500).json({ error: error.message || "Internal error" });
  }
});

// Helper functions
function translateToVietnamese(message) {
  const translations = {
    "Possible spelling mistake found.": "Phát hiện có thể là lỗi chính tả.",
    "Möglicher Tippfehler gefunden.": "Phát hiện có thể là lỗi chính tả.",
    "Ein Vorschlag zur Verbesserung des Stils.": "Đề xuất cải thiện phong cách.",
    "Ist dies ein doppeltes Wort?": "Có phải là từ lặp không?",
    "This sentence does not start with an uppercase letter.": "Câu này không bắt đầu bằng chữ hoa.",
    "Use a comma before 'and' in a list of three or more items.": "Sử dụng dấu phẩy trước 'and' trong danh sách có ba mục trở lên.",
    // Add more as needed
  };
  return translations[message] || message; // Fallback to original
}

function analyzeTargetWord(sentence, targetWord, errors) {
  if (!targetWord) return "Không có từ mục tiêu để phân tích.";

  const lowerSentence = sentence.toLowerCase();
  const lowerTarget = targetWord.toLowerCase();
  const isUsed = lowerSentence.includes(lowerTarget);

  if (!isUsed) {
    return `Từ "${targetWord}" không được sử dụng trong câu. Bạn nên thêm nó vào để hoàn thiện câu.`;
  }

  // Check for errors related to targetWord
  const targetErrors = errors.filter(e => {
    const start = e.offset;
    const end = start + e.length;
    const wordInError = sentence.slice(start, end).toLowerCase();
    return wordInError.includes(lowerTarget);
  });

  if (targetErrors.length > 0) {
    return `Từ "${targetWord}" được sử dụng nhưng có lỗi: ${targetErrors.map(e => e.vietnameseExplanation).join(', ')}. Đề xuất sửa: ${targetErrors[0].suggestions.join(', ')}.`;
  }

  // For verbs, check conjugation - simplified
  // This is basic; in reality, might need more logic
  return `Từ "${targetWord}" được sử dụng đúng trong câu.`;
}

function generateGrammarAnalysis(sentence, errors) {
  const grammarErrors = errors.filter(e => e.type === 'grammar');
  if (grammarErrors.length === 0) return "Ngữ pháp của câu này đúng.";

  return `Câu có ${grammarErrors.length} lỗi ngữ pháp: ${grammarErrors.map(e => e.vietnameseExplanation).join('; ')}. Hãy chú ý đến vị trí động từ, mạo từ và cách.`;
}

function generateVocabularyAnalysis(sentence, targetWord) {
  return `Từ vựng sử dụng: Câu sử dụng từ "${targetWord}" và các từ khác. Hãy đảm bảo từ được dùng đúng nghĩa.`;
}

function generateStructureAnalysis(sentence) {
  return "Cấu trúc câu: Câu theo thứ tự SVO (Chủ ngữ - Động từ - Tân ngữ). Động từ thường ở vị trí thứ hai trong mệnh đề chính.";
}

function generateFeedback(errors, targetWordAnalysis) {
  const mistakeSummary = errors.length > 0 ? `Bạn đã mắc ${errors.length} lỗi: ${errors.map(e => e.type).join(', ')}.` : "Không có lỗi nào.";
  const tips = "Để cải thiện: Luyện tập ngữ pháp hàng ngày, đọc nhiều văn bản tiếng Đức.";
  return `${mistakeSummary} ${targetWordAnalysis} ${tips}`;
}

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log("Server chạy cổng" + PORT));