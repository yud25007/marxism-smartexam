import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://gdxokmehgoijpyhqpyel.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkeG9rbWVoZ29panB5aHFweWVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjMyNTM4NCwiZXhwIjoyMDgxOTAxMzg0fQ.T7z7JxbucPs3uqsotmPP4KzkX2n21vZFsJg9J661k3k';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function sync() {
    console.log("正在从云端抓取最新修正后的题库...");
    
    // 1. 获取所有试卷
    const { data: exams, error: eError } = await supabase.from('exams').select('*').order('created_at', { ascending: true });
    if (eError) throw eError;

    const fullExams = [];

    // 2. 递归获取每个试卷的所有题目（确保 1.3 万道题不漏）
    for (const exam of exams) {
        console.log(`正在处理章节: ${exam.title} ...`);
        const allQuestions = [];
        let from = 0;
        let hasMore = true;

        while (hasMore) {
            const { data: qs, error: qError } = await supabase
                .from('questions')
                .select('*')
                .eq('exam_id', exam.id)
                .order('created_at', { ascending: true })
                .range(from, from + 999);
            
            if (qError) throw qError;
            if (!qs || qs.length === 0) {
                hasMore = false;
            } else {
                allQuestions.push(...qs.map(q => ({
                    id: q.id,
                    type: q.type,
                    text: q.text,
                    options: q.options,
                    correctAnswers: q.correct_answers,
                    points: q.points,
                    answerText: q.answer_text
                })));
                if (qs.length < 1000) hasMore = false;
                from += 1000;
            }
        }

        fullExams.push({
            ...exam,
            durationMinutes: exam.duration_minutes,
            coverImage: exam.cover_image,
            questionCount: exam.question_count,
            questions: allQuestions
        });
    }

    // 3. 构造 TypeScript 源码
    const sourceCode = `/** 
 * 云端同步生成的静态题库文件 
 * 同步时间: ${new Date().toLocaleString()}
 * 注意：请勿手动修改此文件，修改答案请前往后台并运行 sync_to_source.js
 */
import { Exam } from './types';

export const STATIC_CLOUD_EXAMS: Exam[] = ${JSON.stringify(fullExams, null, 2)};
`;

    fs.writeFileSync('E:/marxism-smartexam-final/cloud_data.ts', sourceCode, 'utf8');
    console.log("\n✅ 同步成功！最新题库已硬解码保存至: cloud_data.ts");
    process.exit(0);
}

sync();
