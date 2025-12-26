# ☁️ Cloudflare Pages 项目配置与运维指南

本手册旨在指导如何完成 `marxism-smartexam` 项目在 Cloudflare 上的深度配置，确保云端功能（登录、AI、数据库）正常运行并实现全自动化发布。

---

## 1. 🔑 环境变量配置 (关键：解决无法登录问题)
由于 Cloudflare 无法读取您本地的 `.env` 文件，您必须在控制台手动注入 Supabase 和 Gemini 的密钥。

### 操作步骤：
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2. 进入 **Workers & Pages** -> 点击项目名 **marxism-smartexam**。
3. 导航至 **Settings (设置)** -> **Environment Variables (环境变量)**。
4. 在 **Production (生产环境)** 栏目点击 **Add variables**。
5. **依次添加以下变量**（值请参考您本地的 `.env` 文件）：

| 变量名 (Variable Name) | 示例值说明 |
| :--- | :--- |
| `VITE_SUPABASE_URL` | 您的 Supabase 项目地址 (https://xxx.supabase.co) |
| `VITE_SUPABASE_ANON_KEY` | 您的 Supabase 匿名 Key (eyJhbG...) |
| `VITE_GEMINI_API_KEY` | 您的 Gemini AI 密钥 (如果使用了 AI 功能) |

6. 点击 **Save** 保存。
7. **注意**：添加变量后，必须**重新部署**一次（手动触发或 Push 代码）才能让变量生效。

---

## 2. 🔄 关联 GitHub 实现全自动部署 (强烈推荐)
目前您使用的是手动 `wrangler deploy`。关联 GitHub 后，只要执行 `git push`，网站就会自动更新。

### 操作步骤：
1. 在 Cloudflare 项目面板点击 **Settings** -> **Build & deployments**。
2. 找到 **Service integration** -> 点击 **Connect to Git**。
3. 选择您的 GitHub 账号及仓库 `yud25007/marxism-smartexam`。
4. **Build settings** 配置如下：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (由于项目就在根目录，保持默认)
5. 点击 **Save and Deploy**。

---

## 3. 🚀 性能进一步优化建议

### 开启 Brotli 压缩
Cloudflare 默认开启 Brotli。这比 Gzip 能多节省约 20% 的流量，使 800KB 的 JS 包在弱网下的下载时间显著缩短。

### 配置单页应用 (SPA) 路由重定向
如果用户刷新页面出现 404（例如在 `/history` 页面刷新），需要添加重定向规则：
1. 在项目根目录（E:/marxism-smartexam-final）创建文件 `_redirects`。
2. 内容写入：`/* /index.html 200`。
3. 重新部署即可。

---

## 4. 🌐 绑定自定义域名
如果您有自己的域名（如 `marxism.top`）：
1. 在项目面板点击 **Custom domains**。
2. 点击 **Set up a custom domain**。
3. 输入您的域名，Cloudflare 会引导您自动完成 DNS 解析。
4. 绑定后，全球访问速度会更加均衡，且品牌感更强。

---

## 5. 🛠️ 日常更新流程
*   **关联 GitHub 后**：直接在 CLI 让我执行 `git push` 即可。
*   **手动部署**：如果不想走 GitHub，在终端执行 `npm run build && npx wrangler pages deploy dist`。

---
**配置完成检查点**：
- [ ] 访问新域名，尝试登录，确认是否报 API Key 错误。
- [ ] 在手机端测试 LCP（首屏加载时间），理想状态应在 3-5s 内。
