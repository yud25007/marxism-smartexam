import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import http from 'http';

const CONFIG_PATH = './sync_config.json';
const SUPABASE_URL = 'https://gdxokmehgoijpyhqpyel.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkeG9rbWVoZ29panB5aHFweWVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjMyNTM4NCwiZXhwIjoyMDgxOTAxMzg0fQ.T7z7JxbucPs3uqsotmPP4KzkX2n21vZFsJg9J661k3k';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Load or Init Config
function getConfig() {
    try {
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (e) {
        return { targetPath: "E:/marxism-smartexam-final/cloud_data.ts", port: 3001 };
    }
}

async function runSync() {
    const config = getConfig();
    console.log(`[${new Date().toLocaleTimeString()}] 正在同步至: ${config.targetPath}`);
    
    const { data: exams, error: eError } = await supabase.from('exams').select('*').order('created_at', { ascending: true });
    if (eError) throw eError;

    const fullExams = [];
    for (const exam of exams) {
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

    const sourceCode = `/** 
 * 云端同步生成的静态题库文件 
 * 同步时间: ${new Date().toLocaleString()}
 */
import { Exam } from './types';

export const STATIC_CLOUD_EXAMS: Exam[] = ${JSON.stringify(fullExams, null, 2)};
`;

    fs.writeFileSync(config.targetPath, sourceCode, 'utf8');
    return { success: true, count: fullExams.length, path: config.targetPath };
}

// Simple HTTP Server
const server = http.createServer(async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/status' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'online', config: getConfig() }));
    } 
    else if (req.url === '/sync' && req.method === 'POST') {
        try {
            const result = await runSync();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
    }
    else if (req.url === '/config' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const newConfig = JSON.parse(body);
                fs.writeFileSync(CONFIG_PATH, JSON.stringify({ ...getConfig(), ...newConfig }, null, 2));
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } catch (err) {
                res.writeHead(400);
                res.end('Invalid JSON');
            }
        });
    }
    else {
        res.writeHead(404);
        res.end();
    }
});

const port = getConfig().port;
server.listen(port, () => {
    console.log(`\n🚀 马原同步助手已启动！`);
    console.log(`📡 监听地址: http://localhost:${port}`);
    console.log(`📁 固化位置: ${getConfig().targetPath}`);
    console.log(`💡 现在可以在管理员后台直接“一键同步”了。\n`);
});
