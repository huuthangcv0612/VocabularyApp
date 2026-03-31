import { useRef, useEffect, useState } from "react";

function Wheel({ words, setView }) {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [selected, setSelected] = useState(null);
  const [sentence, setSentence] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [checking, setChecking] = useState(false);

  const getHighlightedCorrection = (original, checks) => {
    if (!original || !Array.isArray(checks)) return null;

    const replacements = checks
      .filter(
        (c) =>
          c?.replacements?.length > 0 &&
          typeof c.offset === "number" &&
          typeof c.length === "number" &&
          c.offset >= 0 &&
          c.length >= 0
      )
      .sort((a, b) => a.offset - b.offset);

    if (replacements.length === 0) return null;

    const parts = [];
    let cursor = 0;

    for (const check of replacements) {
      const offset = Math.min(check.offset, original.length);
      const end = Math.min(check.offset + check.length, original.length);

      if (cursor < offset) {
        parts.push({ text: original.slice(cursor, offset), highlight: false });
      }

      const replacementText = check.replacements[0] || "";
      parts.push({ text: replacementText, highlight: true });
      cursor = end;
    }

    if (cursor < original.length) {
      parts.push({ text: original.slice(cursor), highlight: false });
    }

    return parts;
  };

  const evaluateFeedback = (sentenceText, selectedWord, feedbackData) => {
    if (!feedbackData || feedbackData.error) return null;

    const checks = feedbackData.checks || [];
    const source = (sentenceText || "").trim();

    const uniq = (items) => [...new Set(items.filter(Boolean))];

    const ruleIdToType = {
      MORFOLOGY: "rechtschreibung",
      MORPHOLOGY: "grammatik",
      SENTENCE_STRUCTURE: "satzbau",
      WORD_ORDER: "satzbau",
      VOICE: "natuerlichkeit",
      STYLE: "natuerlichkeit",
      WORD_CHOICE: "wortschatz",
    };

    const checksByType = {
      grammatik: [],
      wortschatz: [],
      satzbau: [],
      natuerlichkeit: [],
      rechtschreibung: [],
    };

    checks.forEach((c) => {
      const ruleId = (c.ruleId || "").toUpperCase();
      const criterion = ruleIdToType[ruleId];
      if (criterion) checksByType[criterion].push(c);
    });

    const spellingIssues = checksByType.rechtschreibung.length
      ? checksByType.rechtschreibung
      : checks.filter((c) => {
          const msg = c.message || "";
          return (
            c.category === "misspelling" ||
            /spelling|Tippfehler|Rechtschreibung|orthograph/i.test(msg)
          );
        });

    const grammarIssues = checksByType.grammatik.length
      ? checksByType.grammatik
      : checks.filter((c) => {
          const msg = c.message || "";
          return (
            c.category === "grammar" ||
            /Verb|Wortstellung|Satzbau|Grammatik|morphology|syntax|Konjugation/i.test(msg)
          );
        });

    const wordOrderIssues = checksByType.satzbau.length
      ? checksByType.satzbau
      : checks.filter((c) => {
          const msg = c.message || "";
          return /Wortstellung|word order|syntax|order/i.test(msg);
        });

    const wordChoiceIssues = checksByType.wortschatz.length
      ? checksByType.wortschatz
      : checks.filter((c) => {
          const msg = c.message || "";
          return /Wortwahl|word choice|usage|wrong word|ausdrück|falsch/i.test(msg);
        });

    const styleIssues = checksByType.natuerlichkeit.length
      ? checksByType.natuerlichkeit
      : checks.filter((c) => {
          const msg = c.message || "";
          return c.category === "style" || /stil|unnatürlich|formal|sounding/i.test(msg);
        });

    const hasSubordinator = /\b(weil|dass|obwohl|nachdem|während|wenn|als)\b/i.test(source);
    const hasCommaClause = /,\s*[A-Za-z]/.test(source);
    const hasB1Clause = hasSubordinator && hasCommaClause;

    const normalizedWordPattern = selectedWord
      ? new RegExp(`\\b${selectedWord.word.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "i")
      : null;

    const hasExplicitPronoun = /\b(ich|du|er|sie|es|wir|ihr|Sie)\b/i.test(source);
    const isSubjectCandidate = selectedWord
      ? new RegExp(`^\\s*${selectedWord.word.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "i").test(source)
      : false;
    const isVerbTransitivePattern = /\b(trinke|isst|sehen|höre|kaufen|bekomme)\b/i.test(source);
    const hasSubjectProblem = isSubjectCandidate && isVerbTransitivePattern && !hasExplicitPronoun;

    const hasOddAdverbs = /\b(sehr\s+gerne\s+oft\s+manchmal|oft\s+manchmal|manchmal\s+oft)\b/i.test(source);

    const usedWord = normalizedWordPattern ? normalizedWordPattern.test(source) : true;

    const wortschatzValue = !usedWord
      ? "cần dùng đúng từ được cho"
      : wordChoiceIssues.length === 0
      ? "passend"
      : "unpassend";

    const likelyTranslated = checks.some((c) => /likely translated/i.test(c.message || "") || /likely translated/i.test(c.message_vi || ""));

    return {
      grammatik: {
        label: "Ngữ pháp",
        value: grammarIssues.length === 0 ? "gut" : "noch Fehler",
        reasons: uniq(grammarIssues.map((c) => c.message_vi || c.message)),
      },
      wortschatz: {
        label: "Từ vựng",
        value: wortschatzValue,
        reasons: uniq([
          ...(wortschatzValue !== "Phù hợp" ? wordChoiceIssues.map((c) => c.message_vi || c.message) : []),
          !usedWord ? `Câu cần chứa từ: ${selectedWord?.word || "từ được cho"}` : null,
        ]),
      },
      satzbau: {
        label: "Cấu trúc câu",
        value: wordOrderIssues.length === 0 ? "korrekt" : "Cần cải thiện",
        reasons: uniq(wordOrderIssues.map((c) => c.message_vi || c.message)),
      },
      natuerlichkeit: {
        label: "Tính tự nhiên",   
        value:
          likelyTranslated || hasSubjectProblem || hasOddAdverbs
            ? "không tự nhiên"
            : styleIssues.length === 0
            ? "tự nhiên"
            : "Hơi cứng, cần cải thiện",
        reasons: uniq([
          ...styleIssues.map((c) => c.message_vi || c.message),
          hasSubjectProblem ? "Câu có thể thiếu chủ ngữ rõ ràng" : null,
          hasOddAdverbs ? "Câu dùng trạng từ quá dư, không tự nhiên" : null,
          likelyTranslated ? "Câu có dấu hiệu dịch word-by-word" : null,
        ]),
      },
      rechtschreibung: {
        label: "Chính tả",
        value: spellingIssues.length === 0 ? "ok" : "Fehler",
        reasons: uniq(spellingIssues.map((c) => c.message_vi || c.message)),
      },
      bonusB1: {
        label: "B1",
        value: hasB1Clause ? "đã mở rộng" : "cần mở rộng",
        reasons: hasB1Clause
          ? ["Câu có liên từ phụ và mệnh đề phụ (giảm bớt chữ chính thức), phù hợp B1"]
          : ["Nên dùng liên từ (weil/dass/obwohl/nachdem) + câu phức (với động từ cuối) để đạt B1"],
      },
    };
  };

  useEffect(() => {
    const drawWheel = (rotationValue = 0) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (!words || words.length === 0) return;

      const ctx = canvas.getContext("2d");

      const size = 600;
      const centerX = size / 2;
      const centerY = size / 2;
      const radius = 260;
      const slice = (Math.PI * 2) / words.length;

      ctx.clearRect(0, 0, size, size);

      // Draw segments
      words.forEach((w, i) => {
        const start = i * slice + rotationValue;
        const end = start + slice;

        // Vibrant colors
        ctx.fillStyle = `hsl(${(i * 360) / words.length}, 78%, 53%)`;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, start, end);
        ctx.closePath();
        ctx.fill();

        // Add border to each segment
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(start + slice / 2);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "right";
        ctx.fillText(w.word.substring(0, 15), radius - 10, 6);
        ctx.restore();
      });

      // Draw center circle
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 70, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY, 73, 0, Math.PI * 2);
      ctx.strokeStyle = "#cccccc";
      ctx.lineWidth = 4;
      ctx.stroke();

      // shadow (not needed in every frame but ok)
      ctx.shadowBlur = 0;
    };

    drawWheel(rotation);
  }, [rotation, words, selected]);

  const getSelectedIndex = (rotationValue) => {
    if (!words || words.length === 0) return null;

    const slice = (Math.PI * 2) / words.length;
    const normalized = ((rotationValue % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const offset = (2 * Math.PI - normalized + slice / 2) % (2 * Math.PI);
    return Math.floor(offset / slice) % words.length;
  };

  const spin = () => {
    if (spinning || !words || words.length === 0) return;

    setSpinning(true);
    setSelected(null);

    const startRotation = rotation;
    const extraTurns = Math.random() * 3 + 4;
    const targetRotation = startRotation + extraTurns * 2 * Math.PI;
    const duration = 3000;
    const startTime = performance.now();

    const frame = (currentTime) => {
      const t = Math.min((currentTime - startTime) / duration, 1);
      // Thêm easing nhanh đầu rồi chậm dần (ease-out cubic)
      const eased = 1 - Math.pow(1 - t, 4);
      const nextRotation = startRotation + (targetRotation - startRotation) * eased;
      setRotation(nextRotation);

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        setSpinning(false);
        const index = getSelectedIndex(nextRotation);
        // Delay 2.5 giây để tạo hồi hộp và học sinh kịp xem từ được chỉ
        setTimeout(() => {
          setSelected(words[index]);
        }, 2500);
      }
    };

    requestAnimationFrame(frame);
  };

  const rubric = evaluateFeedback(sentence, selected, feedback);

  if (!words || words.length === 0) {
    return <p>Không có dữ liệu</p>;
  }

  return (
    <div className="wheel-screen">
      <button className="back-left-btn" onClick={() => setView("dashboard")}>← Back</button>

      <h2 className="text-3xl mt-10 mb-6 font-bold">🎯 Vòng quay</h2>

      {!selected && (
        <>
          <div className="wheel-container">
            <div className="wheel-pointer"></div>
            <canvas 
              ref={canvasRef} 
              width={600} 
              height={600}
              className="wheel-canvas"
            />
          </div>

          <div className="spin-btn-wrapper">
            <button 
              onClick={spin} 
              disabled={spinning}
              className="spin-btn"
            >
              {spinning ? 'Đang quay...' : 'Quay'}
            </button>
          </div>
        </>
      )}

      {selected && (
        <div className="word-card p-8 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg rounded-lg max-w-md mx-auto mt-6">
          <h3 className="selected-word">{selected.word}</h3>
          <p className="text-lg text-purple-600 mb-4">Nghĩa: {selected.meaning}</p>

          <label className="block text-left mb-2 font-semibold text-slate-700">Viết một câu sử dụng từ này:</label>
          <textarea
            className="sentence-input"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder="Mẫu: ..."
            rows={4}
          />

          <button
            className="complete-btn"
            disabled={checking || sentence.trim().length === 0}
            onClick={async () => {
              if (sentence.trim().length === 0) return;

              setChecking(true);
              try {
                const r = await fetch("http://localhost:3000/grammar-check", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sentence, language: "de-DE" }),
                });

                const data = await r.json();
                if (!r.ok) {
                  setFeedback({ error: data.error || "Lỗi máy chủ" });
                } else {
                  setFeedback(data);
                }
              } catch (e) {
                console.error(e);
                setFeedback({ error: "Không thể kết nối server" });
              } finally {
                setChecking(false);
              }
            }}
          >
            {checking ? "Đang kiểm tra..." : "Kiểm tra ngữ pháp"}
          </button>

          {feedback && (
            <div className="mt-5 text-left text-sm text-slate-700">
              {feedback.error ? (
                <p className="text-red-600">{feedback.error}</p>
              ) : (
                <>
                  <p className={feedback.isValid ? "text-green-600" : "text-orange-600"}>
                    {feedback.isValid
                      ? "👏 Câu đúng ngữ pháp"
                      : `⚠️ Phát hiện ${feedback.errorCount} lỗi`}
                  </p>

                  {!feedback.isValid && (
                    <div className="mt-4">
                      <ul className="list-disc pl-5 space-y-2">
                        {feedback.checks.map((c, idx) => (
                          <li key={idx} className="text-slate-700">
                            <span className="font-semibold">{c.message_vi || c.message}</span>
                          </li>
                        ))}
                      </ul>

                      {feedback.suggestedSentence && (
                        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                          <strong className="text-sm text-slate-600">Câu sửa:</strong>
                          <div className="mt-1 text-slate-900 font-semibold">
                            {getHighlightedCorrection(feedback.sentence || sentence, feedback.checks)?.map((part, pidx) => (
                              <span
                                key={pidx}
                                className={part.highlight ? "bg-yellow-200 text-black" : ""}
                              >
                                {part.text}
                              </span>
                            )) || feedback.suggestedSentence}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">Đã tô nổi những phần đã được sửa để học sinh dễ nhận ra.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {feedback.isValid && (
                    <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                      <strong>Câu này đã tốt, bạn có thể nhấn "Hoàn thành" để quay tiếp.</strong>
                    </div>
                  )}

                  {rubric && (
                    <div className="mt-6 p-4 rounded-lg bg-slate-50 border border-slate-200">
                      <h4 className="font-bold text-lg mb-3">✅ Đánh giá theo tiêu chí</h4>
                      <ul className="space-y-3">
                        {Object.values(rubric).map((item) => (
                          <li key={item.label}>
                            <p>
                              <span className="font-semibold">✔️ {item.label}:</span> {item.value}
                            </p>
                            {item.reasons && item.reasons.length > 0 && ["noch Fehler", "unpassend", "verbessern", "etwas unnatürlich", "Fehler", "cần mở rộng"].includes(item.value) && (
                              <ul className="mt-1 ml-5 list-disc text-sm text-slate-700 space-y-1">
                                {item.reasons.map((r, ri) => (
                                  <li key={ri}>{r}</li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {feedback && (
            <button
              className="complete-btn mt-4"
              onClick={() => {
                setSelected(null);
                setSentence("");
                setFeedback(null);
                setSpinning(false);
              }}
            >
              Hoàn thành & Quay lại vòng quay
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Wheel;