# 成都蓉城足球俱乐部官网（CD Rangers FC）

基于 **Next.js App Router + Prisma + PostgreSQL + NextAuth** 的全栈项目，覆盖：

- 用户注册、邮箱验证、登录、角色权限（普通用户 / 管理员）
- 赛程与结果、比赛详情
- 球队模块（一线队 / 梯队 / 教练组）与球员详情
- 新闻中心（分类筛选 + 分页）
- 票务信息（模拟）
- 官方商店（模拟，多角度图片、价格、库存）
- 关于俱乐部
- 用户偏好与收藏
- 管理员后台（示例：发布新闻）

## 技术栈

- 前端：React 19 + Next.js 16（App Router）
- 样式：Tailwind CSS 4
- 数据库：PostgreSQL
- ORM：Prisma 7
- 认证：NextAuth（Credentials）

## 项目结构

```txt
src/
  app/
    (页面路由 + API Route Handlers)
  components/
    layout/
    site/
    ui/
  lib/
    auth.ts
    prisma.ts
    data.ts
    session.ts
    validation.ts
prisma/
  schema.prisma
  seed.mjs
scripts/
  scrape-cdrcfc.mjs
```

## 环境变量

复制 `.env.example` 为 `.env.local` 并修改：

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rongchengfc?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-strong-random-secret"
```

## 安装与运行

1. 安装依赖

```bash
npm install
```

2. 生成 Prisma Client

```bash
npm run prisma:generate
```

3. 创建/同步数据库结构

```bash
npm run prisma:migrate -- --name init
# 或开发期快速同步
npm run db:push
```

4. 写入种子数据

```bash
npm run prisma:seed
```

5. 启动开发环境

```bash
npm run dev
```

访问：<http://localhost:3000>

## 默认测试账号（种子）

- 管理员：`admin@cdrfc.cn` / `Admin@123456`
- 普通用户：`fan@cdrfc.cn` / `User@123456`

## 生产构建

```bash
npm run build
npm run start
```

## 数据抓取脚本（初始化参考）

已提供脚本：`scripts/scrape-cdrcfc.mjs`

用途：从 `https://www.cdrcfc.com.cn` 抓取新闻和队伍基础信息并输出为 JSON。

```bash
npm run scrape:cdrcfc
```

输出目录：`data/scraped/`

## PostgreSQL SQL + Python 同步目录

已新增独立目录：`ops/pg_sync/`，用于数据库 SQL 和 Python 同步脚本管理。

- SQL：`ops/pg_sync/sql/`
- Python：`ops/pg_sync/python/`
- 说明文档：`ops/pg_sync/README.md`

常用命令：

```bash
uv sync --project ops/pg_sync/python
uv run --project ops/pg_sync/python python ops/pg_sync/python/run_sql_sync.py --include-bootstrap
uv run --project ops/pg_sync/python python ops/pg_sync/python/run_sql_sync.py
uv run --project ops/pg_sync/python python ops/pg_sync/python/crawl_cdrcfc.py
uv run --project ops/pg_sync/python python ops/pg_sync/python/sync_crawled_to_pg.py --sync-app
```

## 主要 API

- `POST /api/auth/register`：注册并生成邮箱验证链接
- `GET /api/auth/verify-email?token=...`：验证邮箱
- `GET /api/matches`：比赛列表
- `GET /api/news`：新闻列表（分类/分页）
- `GET /api/products`：商品列表
- `GET/PUT /api/user/preferences`：用户偏好
- `GET/POST/DELETE /api/user/favorites`：用户收藏
- `POST /api/admin/news`：管理员发布新闻

## 代码规范与提交建议

- Lint：

```bash
npm run lint
```

- 提交信息建议遵循 Conventional Commits：
  - `feat: ...`
  - `fix: ...`
  - `refactor: ...`
  - `docs: ...`

## 说明

- 本项目当前以 SSR 动态渲染为主，便于实时读取数据库内容。
- 图片已统一走 `next/image`。
- SEO 基础文件已配置：`metadata`、`robots.txt`、`sitemap.xml`。
