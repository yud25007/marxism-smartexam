import { GoogleGenAI } from "@google/genai";
import { Question } from "../types";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const getQuestionExplanation = async (
  question: Question,
  userSelectedIndices: number[]
): Promise<string> => {
  if (!apiKey) {
    return "AI 解析不可用：未检测到 API Key。";
  }

  const userAnswers = userSelectedIndices.map(i => question.options[i]).join(', ') || "未作答";
  const correctAnswers = question.correctAnswers.map(i => question.options[i]).join(', ');

  const prompt = `
    你是一位专业的马克思主义理论辅导老师。请为以下考试题目提供简洁明了的解析。
    
    题目: "${question.text}"
    选项: ${JSON.stringify(question.options)}
    
    用户的回答: "${userAnswers}"
    正确答案: "${correctAnswers}"
    
    请按以下格式回答：
    1. 解释为什么正确答案是正确的（结合马克思主义基本原理）。
    2. 如果用户答错了，指出其误区所在。
    3. 保持语气鼓励和具有教育意义。
    4. 字数控制在 200 字以内。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "无法生成解析。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "抱歉，暂时无法获取 AI 解析，请稍后再试。";
  }
};