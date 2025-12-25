import json
import os
from supabase import create_client

# 请替换为你的 Supabase 配置
# 也可以从项目的 .env 获取
URL = "你的_SUPABASE_URL"
KEY = "你的_SUPABASE_SERVICE_ROLE_KEY" # 建议使用 service_role_key 以绕过 RLS

if not URL or URL == "你的_SUPABASE_URL":
    print("错误：请先在脚本中填写 Supabase URL 和 KEY")
    exit()

supabase = create_client(URL, KEY)

def migrate():
    # 1. 读取 JSON
    with open("E:/questions.json", 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"读取到 {len(data)} 道题目，准备导入...")

    # 2. 创建或更新试卷
    exam_id = "external_full_import"
    supabase.table('exams').upsert({
        "id": exam_id,
        "title": "全量导入题库 (JSON)",
        "description": f"从 questions.json 导入，共 {len(data)} 题",
        "category": "全量库",
        "difficulty": "Medium"
    }).execute()

    # 3. 分批导入题目 (每批 100 题)
    batch_size = 100
    for i in range(0, len(data), batch_size):
        batch = data[i:i + batch_size]
        payload = []
        for q in batch:
            # 答案转换 A -> 0
            correct_answers = [ord(a) - 65 for a in q.get('answer', [])]
            
            # 选项转换
            options = []
            opt_obj = q.get('options', {})
            for key in ['A', 'B', 'C', 'D']:
                if opt_obj.get(key):
                    options.append(f"{key}. {opt_obj[key]}")

            payload.append({
                "id": f"ext_{q['id']}",
                "exam_id": exam_id,
                "type": "MULTIPLE_CHOICE" if len(correct_answers) > 1 else "SINGLE_CHOICE",
                "text": q['question'],
                "options": options,
                "correct_answers": correct_answers,
                "points": 2
            })
        
        try:
            supabase.table('questions').upsert(payload).execute()
            print(f"进度: {i + len(batch)} / {len(data)}")
        except Exception as e:
            print(f"批次导入失败: {e}")

    print("全部导入完成！")

if __name__ == "__main__":
    migrate()
