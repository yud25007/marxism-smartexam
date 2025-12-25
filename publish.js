import { execSync } from 'child_process';
import fs from 'fs';

async function publish() {
    try {
        console.log("🚀 开始全自动化发布流程...");

        // 1. 执行同步逻辑 (硬解码云端题库到本地源码)
        console.log("1/3: 正在同步云端题库并生成本地源码...");
        execSync('node sync_to_source.js', { stdio: 'inherit' });

        // 2. 检查是否有文件变化
        const status = execSync('git status --porcelain').toString();
        if (!status) {
            console.log("✨ 题库已是最新，无需推送。");
            return;
        }

        // 3. 执行 Git 推送
        console.log("2/3: 正在暂存并提交变更...");
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "data: update cloud_data.ts with latest cloud corrections"', { stdio: 'inherit' });

        console.log("3/3: 正在推送到 GitHub...");
        execSync('git push origin master', { stdio: 'inherit' });

        console.log("\n🎉 全球同步完成！用户现在将体验到最新的正确答案。");
    } catch (error) {
        console.error("\n❌ 发布失败:", error.message);
    }
}

publish();
