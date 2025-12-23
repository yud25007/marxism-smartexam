import { Question } from "../types";

const API_KEY = import.meta.env.GEMINI_API_KEY;
const BASE_URL = import.meta.env.GEMINI_BASE_URL;
const MODEL = import.meta.env.GEMINI_MODEL;

export const getAIExplanation = async (
  question: Question,
  userSelectedIndices: number[]
): Promise<string> => {
  if (!API_KEY) return "AI 秘钥未配置";

  const userAnswers = userSelectedIndices.map(i => question.options[i]).join(', ') || "未作答";
  const correctAnswers = question.correctAnswers.map(i => question.options[i]).join(', ');

  const prompt = 你是一位专业的马克思主义理论辅导老师。请为以下题目提供简洁明了的解析：

    题目: ""
    选项: \

    用户的回答: ""
    正确答案: ""

    请按以下格式回答：
    1. 解释正确答案的原因（结合马克思主义基本原理）。
    2. 如果用户答错了，指出其误区所在。
    3. 保持鼓励和具有教育意义的语气。
    4. 字数控制在 200 字以内。;

  try {
    const response = await fetch(\\/chat/completions\, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \Bearer \\
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || \HTTP error! status: \\);
    }

    const data = await response.json();
    return data.choices[0].message.content || "无法生成解析。";
  } catch (error) {
    console.error("AI API Error:", error);
    return "抱歉，暂时无法获取 AI 解析，请稍后再试。错误信息: " + (error instanceof Error ? error.message : "未知错误");
  }
};
