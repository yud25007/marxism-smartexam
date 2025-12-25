import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://gdxokmehgoijpyhqpyel.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkeG9rbWVoZ29panB5aHFweWVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjMyNTM4NCwiZXhwIjoyMDgxOTAxMzg0fQ.T7z7JxbucPs3uqsotmPP4KzkX2n21vZFsJg9J661k3k';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrate() {
    console.log("🚀 启动全量迁移程序...");
    
    let rawData;
    try {
        const fileContent = fs.readFileSync('E:/questions.json', 'utf8');
        rawData = JSON.parse(fileContent);
    } catch (e) {
        console.error("❌ 读取 E:/questions.json 失败，请确认文件路径正确。");
        return;
    }
    
    // 章节映射配置
    const chapters = [
        { id: 'chapter_0', title: '导论', keywords: ['马克思主义', '创始人', '产生的根源'] },
        { id: 'chapter_1', title: '第一章 世界的物质性', keywords: ['唯物辩证法', '对立统一', '物质', '意识'] },
        { id: 'chapter_2', title: '第二章 认识世界和改造世界', keywords: ['实践', '认识', '真理', '价值'] },
        { id: 'chapter_3', title: '第三章 人类社会及其发展', keywords: ['生产力', '生产关系', '经济基础', '上层建筑', '阶级'] },
        { id: 'chapter_4', title: '第四章 资本主义的形成', keywords: ['商品', '剩余价值', '不变资本', '可变资本'] },
        { id: 'chapter_5', title: '第五章 资本主义发展的历史', keywords: ['垄断', '金融资本', '经济全球化'] },
        { id: 'chapter_6', title: '第六章 社会主义社会', keywords: ['科学社会主义', '无产阶级革命'] },
        { id: 'chapter_7', title: '第七章 共产主义', keywords: ['按需分配', '共同理想', '两个必然'] }
    ];

    console.log(`📦 读取到 ${rawData.length} 道题目，开始分类并同步...`);

    // 1. 初始化章节信息
    for (const ch of chapters) {
        await supabase.from('exams').upsert({
            id: ch.id,
            title: ch.title,
            category: '马克思主义基本原理',
            difficulty: 'Medium'
        });
    }

    // 2. 批量处理
    const BATCH_SIZE = 100;
    let successCount = 0;

    for (let i = 0; i < rawData.length; i += BATCH_SIZE) {
        const batch = rawData.slice(i, i + BATCH_SIZE);
        const processedBatch = batch.map(q => {
            // 智能识别章节
            let targetExamId = 'external_full_import'; 
            for (const ch of chapters) {
                if (ch.keywords.some(k => q.question.includes(k))) {
                    targetExamId = ch.id;
                    break;
                }
            }

            // 转换正确答案
            const correctAnswers = Array.isArray(q.answer) 
                ? q.answer.map(a => a.charCodeAt(0) - 65)
                : [];

            // 格式化选项
            const options = [];
            if (q.options.A) options.push(`A. ${q.options.A}`);
            if (q.options.B) options.push(`B. ${q.options.B}`);
            if (q.options.C) options.push(`C. ${q.options.C}`);
            if (q.options.D) options.push(`D. ${q.options.D}`);

            return {
                id: `json_${q.id}`,
                exam_id: targetExamId,
                type: correctAnswers.length > 1 ? 'MULTIPLE_CHOICE' : 'SINGLE_CHOICE',
                text: q.question,
                options: options,
                correct_answers: correctAnswers,
                points: 2
            };
        });

        const { error } = await supabase.from('questions').upsert(processedBatch);
        if (error) {
            console.error(`❌ 进度 ${i} 失败:`, error.message);
        } else {
            successCount += processedBatch.length;
            if (i % 1000 === 0) console.log(`⏳ 已成功导入: ${i} / ${rawData.length}`);
        }
    }

    console.log(`
✅ 迁移圆满完成！累计成功导入 ${successCount} 道题目。`);
    process.exit(0);
}

migrate();