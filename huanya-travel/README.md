# 环亚出行 HuanYa Travel

澳洲华人专属包车竞价平台 — 游客发布行程需求，多位认证司机主动报价，资金平台托管。

---

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在项目根目录创建 `.env.local` 文件，填入以下内容：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**如何获取这两个值：**

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择或新建项目
3. 进入 **Project Settings → API**
4. 复制 **Project URL** 填入 `NEXT_PUBLIC_SUPABASE_URL`
5. 复制 **anon public** key 填入 `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. 初始化数据库

1. 在 Supabase Dashboard 进入 **SQL Editor**
2. 复制 `supabase/migrations/001_initial_schema.sql` 全部内容，粘贴并执行
3. 确认 5 张表已创建：`profiles`、`demands`、`bids`、`orders`、`reviews`

### 4. 启用 Realtime（实时更新）

在 SQL Editor 中执行：

```sql
alter publication supabase_realtime add table public.demands;
alter publication supabase_realtime add table public.bids;
```

### 5. 本地运行

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)

---

## 主要功能路由

| 路由 | 说明 |
|------|------|
| `/` | 首页 |
| `/register` | 注册（选择游客 / 司机角色） |
| `/login` | 登录 |
| `/demand/create` | 游客发布行程需求 |
| `/tourist/dashboard` | 游客行程列表 |
| `/demand/[id]` | 游客查看报价 & 选择司机 |
| `/order/[id]/pay` | 游客支付 10% 定金 |
| `/order/[id]` | 订单详情（支付后解锁联系方式） |
| `/driver/marketplace` | 司机接单大厅（实时刷新） |
| `/profile/driver/[id]` | 司机公开名片页 |

---

## 状态机

```
需求状态：pending → bidding → confirmed → in_progress → completed | cancelled
报价状态：active → accepted | rejected | withdrawn
订单支付：unpaid → deposited → paid_in_full | refunded
```

---

## 技术栈

- **Next.js 15** (App Router, Server Components)
- **Supabase** (PostgreSQL + Auth + RLS + Realtime)
- **Tailwind CSS v4**
- **TypeScript**
