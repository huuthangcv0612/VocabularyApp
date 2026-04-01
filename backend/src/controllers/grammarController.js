const {
  checkGrammar,
  translateToVietnamese,
  analyzeTargetWord,
  generateGrammarAnalysis,
  generateVocabularyAnalysis,
  generateStructureAnalysis,
  generateFeedback,
} = require('../utils/grammar');

// Grammar check endpoint
exports.checkGrammar = async (req, res, next) => {
  try {
    const { sentence, level = 'A2.2' } = req.body;

    if (!sentence || sentence.trim().length === 0) {
      return res.status(400).json({ error: 'sentence là bắt buộc' });
    }

    const result = await checkGrammar(sentence, level);

    if (result.overlyComplex) {
      return res.status(400).json(result);
    }

    const checks = result.errors.map((e) => ({
      message: e.message,
      message_vi: e.message_vi || translateToVietnamese(e.message),
      offset: e.offset,
      length: e.length,
      context: '',
      replacements: e.suggestions,
      ruleId: e.ruleId,
      category: e.category,
    }));

    let suggestedSentence = sentence;
    const replaceables = checks
      .filter((c) => c.replacements && c.replacements.length > 0)
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
      sentence: result.original,
      level: result.level,
      errorCount: result.errorCount,
      isValid: result.isValid,
      checks,
      errors: result.errors,
      suggestedSentence,
    });
  } catch (error) {
    next(error);
  }
};

// Analyze sentence endpoint
exports.analyzeSentence = async (req, res, next) => {
  try {
    const { sentence, targetWord } = req.body;

    if (!sentence || sentence.trim().length === 0) {
      return res.status(400).json({ error: 'sentence là bắt buộc' });
    }

    const ltUrl = process.env.LANGUAGE_TOOL_URL || 'https://api.languagetool.org/v2/check';
    const params = new URLSearchParams();
    params.append('text', sentence);
    params.append('language', 'de');
    params.append('enabledOnly', 'false');

    const ltRes = await fetch(ltUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!ltRes.ok) {
      const text = await ltRes.text();
      throw new Error(`LanguageTool error: ${ltRes.status} ${text}`);
    }

    const result = await ltRes.json();

    const errors = (result.matches || []).map((m) => {
      let type = 'other';
      if (m.rule && m.rule.category) {
        const cat = m.rule.category.id;
        if (cat === 'TYPOS') type = 'spelling';
        else if (cat === 'GRAMMAR') type = 'grammar';
        else if (cat === 'STYLE') type = 'style';
        else if (cat === 'PUNCTUATION') type = 'punctuation';
        else if (cat === 'COLLOQUIALISMS' || cat === 'REDUNDANCY') type = 'style';
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

    const targetWordAnalysis = analyzeTargetWord(sentence, targetWord, errors);

    const analysis = {
      grammar: generateGrammarAnalysis(sentence, errors),
      vocabulary: generateVocabularyAnalysis(sentence, targetWord),
      sentenceStructure: generateStructureAnalysis(sentence),
    };

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
    next(error);
  }
};
