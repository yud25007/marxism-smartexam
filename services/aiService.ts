import { Question, QuestionType } from "../types";
import { authService } from "./authService";

const API_KEY = import.meta.env.GEMINI_API_KEY;
const BASE_URL = import.meta.env.GEMINI_BASE_URL;
const DEFAULT_MODEL = import.meta.env.GEMINI_MODEL;

export const getAIExplanation = async (
  question: Question,
  userSelectedIndices: number[],
  onChunk: (text: string) => void,
  followUpQuestion?: string
): Promise<void> => {
  if (!API_KEY) {
    onChunk("AI 秘钥未配置");
    return;
  }

  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'ADMIN';
  const isVip = user?.role === 'VIP';
  
  let selectedModel = user?.aiModel || DEFAULT_MODEL;
  if (!user?.aiModel) {
    if (isAdmin) selectedModel = 'gemini-3-pro-preview';
    else if (isVip) selectedModel = 'qwen3-coder-plus';
  }

  let userAnswers = "";
  let correctAnswers = "";

  if (question.type === QuestionType.SHORT_ANSWER) {
    userAnswers = "用户已阅读题目并进行了自主思考。";
    correctAnswers = question.answerText || "";
  } else {
    userAnswers = userSelectedIndices.map(i => question.options[i]).join(', ') || "未作答";
    correctAnswers = question.correctAnswers.map(i => question.options[i]).join(', ');
  }

  // ... (Prompt construction logic remains same)
  let prompt = `你是一位专业的马克思主义理论辅导老师。请为以下题目提供简洁明了的解析：
    题目: "${question.text}"
    ${question.type !== QuestionType.SHORT_ANSWER ? `选项: ${JSON.stringify(question.options)}` : ''}
    用户的回答: "${userAnswers}"
    正确答案: "${correctAnswers}"
    请按以下格式回答：
    1. 解释正确答案的原因（结合马克思主义基本原理）。
    2. 如果用户答错了，指出其误区所在。
    3. 字数控制在 150 字以内。`;

  if (isAdmin) {
    prompt = `你现在是一位针对期末考试冲刺的“保姆级”马原辅导老师。
    当前题目: "${question.text}"
    正确答案: "${correctAnswers}"
    你的任务是帮助管理员彻底理解并背诵该知识点。请包含：白话拆解、考点避坑、记忆口诀、核心得分点。语气幽默亲和。`;
  }

  if (followUpQuestion) {
    prompt = `作为保姆级马原辅导老师，请解答关于题目【${question.text}】的深层追问： "${followUpQuestion}"`;
  }

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        stream: true // Enable streaming
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        onContent("⚠️ AI 解析请求过于频繁，请稍等几分钟再试（频率限制）。");
        return;
      }
      throw new Error('API 请求失败');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullContent = "";

    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6);
          if (dataStr === "[DONE]") break;
          try {
            const data = JSON.parse(dataStr);
            const content = data.choices[0]?.delta?.content || "";
            fullContent += content;
            onChunk(fullContent); // Real-time update
          } catch (e) {
            // Ignore incomplete JSON chunks
          }
        }
      }
    }
  } catch (error) {
    console.error("AI API Error:", error);
    onChunk("抱歉，获取解析时出错。");
  }
};
