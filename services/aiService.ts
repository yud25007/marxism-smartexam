import { Question, QuestionType } from "../types";
import { authService } from "./authService";

const API_KEY = import.meta.env.GEMINI_API_KEY;
const BASE_URL = import.meta.env.GEMINI_BASE_URL;
const DEFAULT_MODEL = import.meta.env.GEMINI_MODEL;

export const getAIExplanation = async (
  question: Question,
  userSelectedIndices: number[],
  followUpQuestion?: string
): Promise<string> => {
  if (!API_KEY) return "AI 秘钥未配置";

  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'ADMIN';
  const isVip = user?.role === 'VIP';
  
  // Model selection: Admin defaults to Gemini 3 Pro, VIP defaults to Qwen, others to Default
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

  // Base prompt for normal users
  let prompt = `你是一位专业的马克思主义理论辅导老师。请为以下题目提供简洁明了的解析：
    题目: "${question.text}"
    ${question.type !== QuestionType.SHORT_ANSWER ? `选项: ${JSON.stringify(question.options)}` : ''}
    用户的回答: "${userAnswers}"
    正确答案: "${correctAnswers}"
    请按以下格式回答：
    1. 解释正确答案的原因（结合马克思主义基本原理）。
    2. 如果用户答错了，指出其误区所在。
    3. 字数控制在 150 字以内。`;

  // Admin "Nanny Mode" Prompt
  if (isAdmin) {
    prompt = `你现在是一位针对期末考试冲刺的“保姆级”马原辅导老师。
    当前题目: "${question.text}"
    正确答案: "${correctAnswers}"
    
    你的任务是帮助管理员（准考生）彻底理解并背诵该知识点。请：
    1. 【白话拆解】：用最通俗易懂、接地气的例子解释这个原理，不要说官话。
    2. 【考点避坑】：指出考试中这道题最容易在哪挖坑（比如混淆概念）。
    3. 【记忆口诀】：提供一个朗朗上口的口诀或关键词联想法，帮助快速记忆。
    4. 【核心得分点】：总结出如果遇到简答题，必须写出的几个关键词。
    
    保持极度亲和、幽默、像是在耳边划重点的语气。`;
  }

  // If it's a follow-up session
  if (followUpQuestion) {
    prompt = `作为马原辅导老师，用户（管理员）在理解完题目【${question.text}】的解析后，提出了一个深入问题：
    追问内容: "${followUpQuestion}"
    
    请继续以“保姆级”保过班老师的身份，耐心解答这个疑惑。解释要深入浅出，确保用户能应对期末考试的变化题型。`;
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
        temperature: 0.8 // Slightly higher for admin nanny mode
      })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content || "无法生成解析。";
  } catch (error) {
    console.error("AI API Error:", error);
    return "抱歉，暂时无法获取 AI 解析，请稍后再试。错误信息: " + (error instanceof Error ? error.message : "未知错误");
  }
};
