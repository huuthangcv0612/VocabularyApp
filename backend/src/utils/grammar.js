const LEVEL_ERROR_TYPES = {
  'A1.1': ['spelling', 'verb'],
  'A1.2': ['spelling', 'verb', 'article'],
  'A2.1': ['spelling', 'verb', 'article', 'preposition'],
  'A2.2': ['spelling', 'verb', 'article', 'preposition', 'structure', 'repeat'],
};

const OVERLY_COMPLEX_WORD_LIMIT = 20;

function getIssueTypes(match) {
  const types = new Set();
  const ruleId = (match.rule?.id || '').toUpperCase();
  const categoryId = (match.rule?.category?.id || '').toUpperCase();
  const text = (match.message || '').toLowerCase();

  if (categoryId === 'TYPOS') {
    types.add('spelling');
  }

  if (
    ruleId.includes('DUPLICATE') ||
    text.includes('doppeltes wort') ||
    text.includes('repeated word')
  ) {
    types.add('repeat');
  }

  if (
    ruleId.includes('VERB') ||
    text.includes('verb') ||
    ruleId.includes('TENSE')
  ) {
    types.add('verb');
  }

  if (
    ruleId.includes('ARTICLE') ||
    text.includes('der') ||
    text.includes('die') ||
    text.includes('das')
  ) {
    types.add('article');
  }

  if (
    ruleId.includes('PREP') ||
    ruleId.includes('PREPOSITION') ||
    text.includes('mit') ||
    text.includes('für') ||
    text.includes('nach')
  ) {
    types.add('preposition');
  }

  if (
    ruleId.includes('WORD_ORDER') ||
    ruleId.includes('SENTENCE_STRUCTURE') ||
    categoryId === 'GRAMMAR' ||
    categoryId === 'STYLE'
  ) {
    types.add('structure');
  }

  if (types.size === 0) {
    types.add('other');
  }

  return [...types];
}

function isComplexMatch(match) {
  const ruleId = (match.rule?.id || '').toUpperCase();
  const text = (match.message || '').toLowerCase();

  if (
    ruleId.includes('SUBORDINATE') ||
    ruleId.includes('SUBCLAUSE') ||
    text.includes('weil') ||
    text.includes('dass')
  ) {
    return true;
  }

  if (ruleId.includes('COMPLEX') || ruleId.includes('INVERSION') || ruleId.includes('TENSE')) {
    if (!ruleId.includes('PRESENT') && !ruleId.includes('PAST') && !ruleId.includes('FUTURE')) {
      return true;
    }
  }

  return false;
}

async function checkGrammar(sentence, level = 'A2.2') {
  const normalizedLevel = (level || 'A2.2').toUpperCase();

  const words = sentence.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return { original: sentence, errors: [], isValid: true };
  }

  if (words.length > OVERLY_COMPLEX_WORD_LIMIT) {
    return {
      original: sentence,
      errors: [],
      isValid: false,
      overlyComplex: true,
      message: 'Sentence is too long for A1/A2 checks (more than 20 words).',
    };
  }

  const enabledTypes = LEVEL_ERROR_TYPES[normalizedLevel] || LEVEL_ERROR_TYPES['A2.2'];
  const allowedTypes = new Set(enabledTypes);

  const params = new URLSearchParams();
  params.append('text', sentence);
  params.append('language', 'de-DE');
  params.append('enabledOnly', 'false');
  params.append('level', 'picky');

  const ltRes = await fetch(process.env.LANGUAGE_TOOL_URL || 'https://api.languagetool.org/v2/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!ltRes.ok) {
    const text = await ltRes.text();
    throw new Error(`LanguageTool lỗi: ${ltRes.status} ${text}`);
  }

  const result = await ltRes.json();

  const matches = Array.isArray(result.matches) ? result.matches : [];

  const errors = matches
    .filter((m) => !isComplexMatch(m))
    .map((m) => {
      const issueTypes = getIssueTypes(m);
      return {
        original: sentence.substring(m.offset, m.offset + m.length),
        offset: m.offset,
        length: m.length,
        message: m.message,
        message_vi: translateToVietnamese(m.message),
        suggestions: (m.replacements || []).map((r) => r.value),
        ruleId: m.rule?.id || null,
        category: m.rule?.category?.id || null,
        issueTypes,
      };
    })
    .filter((err) => err.issueTypes.some((t) => allowedTypes.has(t)));

  return {
    original: sentence,
    errors,
    errorCount: errors.length,
    isValid: errors.length === 0,
    level: normalizedLevel,
  };
}

function translateToVietnamese(message) {
  const translations = {
    'Possible spelling mistake found.': 'Phát hiện có thể là lỗi chính tả.',
    'Möglicher Tippfehler gefunden.': 'Phát hiện có thể là lỗi chính tả.',
    'Ein Vorschlag zur Verbesserung des Stils.': 'Đề xuất cải thiện phong cách.',
    'Ist dies ein doppeltes Wort?': 'Có phải là từ lặp không?',
    'This sentence does not start with an uppercase letter.': 'Câu này không bắt đầu bằng chữ hoa.',
    "Use a comma before 'and' in a list of three or more items.": "Sử dụng dấu phẩy trước 'and' trong danh sách có ba mục trở lên.",
  };
  return translations[message] || message;
}

function analyzeTargetWord(sentence, targetWord, errors) {
  if (!targetWord) return 'Không có từ mục tiêu để phân tích.';

  const lowerSentence = sentence.toLowerCase();
  const lowerTarget = targetWord.toLowerCase();
  const isUsed = lowerSentence.includes(lowerTarget);

  if (!isUsed) {
    return `Từ "${targetWord}" không được sử dụng trong câu. Bạn nên thêm nó vào để hoàn thiện câu.`;
  }

  const targetErrors = errors.filter((e) => {
    const start = e.offset;
    const end = start + e.length;
    const wordInError = sentence.slice(start, end).toLowerCase();
    return wordInError.includes(lowerTarget);
  });

  if (targetErrors.length > 0) {
    return `Từ "${targetWord}" được sử dụng nhưng có lỗi: ${targetErrors
      .map((e) => e.vietnameseExplanation)
      .join(', ')}. Đề xuất sửa: ${targetErrors[0].suggestions.join(', ')}.`;
  }

  return `Từ "${targetWord}" được sử dụng đúng trong câu.`;
}

function generateGrammarAnalysis(sentence, errors) {
  const grammarErrors = errors.filter((e) => e.type === 'grammar');
  if (grammarErrors.length === 0) return 'Ngữ pháp của câu này đúng.';

  return `Câu có ${grammarErrors.length} lỗi ngữ pháp: ${grammarErrors
    .map((e) => e.vietnameseExplanation)
    .join('; ')}. Hãy chú ý đến vị trí động từ, mạo từ và cách.`;
}

function generateVocabularyAnalysis(sentence, targetWord) {
  return `Từ vựng sử dụng: Câu sử dụng từ "${targetWord}" và các từ khác. Hãy đảm bảo từ được dùng đúng nghĩa.`;
}

function generateStructureAnalysis(sentence) {
  return 'Cấu trúc câu: Câu theo thứ tự SVO (Chủ ngữ - Động từ - Tân ngữ). Động từ thường ở vị trí thứ hai trong mệnh đề chính.';
}

function generateFeedback(errors, targetWordAnalysis) {
  const mistakeSummary =
    errors.length > 0
      ? `Bạn đã mắc ${errors.length} lỗi: ${errors.map((e) => e.type).join(', ')}.`
      : 'Không có lỗi nào.';
  const tips = 'Để cải thiện: Luyện tập ngữ pháp hàng ngày, đọc nhiều văn bản tiếng Đức.';
  return `${mistakeSummary} ${targetWordAnalysis} ${tips}`;
}

module.exports = {
  checkGrammar,
  translateToVietnamese,
  analyzeTargetWord,
  generateGrammarAnalysis,
  generateVocabularyAnalysis,
  generateStructureAnalysis,
  generateFeedback,
  getIssueTypes,
  isComplexMatch,
  LEVEL_ERROR_TYPES,
};
