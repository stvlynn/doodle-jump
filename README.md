# Doodle Jump - Game Boy Edition

A web-based implementation of the classic Doodle Jump game, styled as a Game Boy game. Jump as high as you can while avoiding falling!

![Game Screenshot](./screenshot.png)

## Sponsoring

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/stvlynn)

[![](https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86)](https://github.com/sponsors/stvlynn)

## Play Online

[Doodle Jump - Game Boy Edition](https://doodle.twi.am)

## Game Instructions

Doodle Jump is a vertical scrolling platform game where you control a character that automatically jumps whenever it lands on a platform. Your goal is to climb as high as possible without falling or hitting obstacles.

### Game Features

- **Dynamic Difficulty**: The game gets progressively harder as your score increases
- **Platform Types**: 
  - Normal (solid green)
  - Moving (blue platforms that move horizontally)
  - Breakable (yellow platforms that break after one use)
  - Spring (platforms with springs that give extra jump height)
- **Power-ups**: Collect rockets to boost high into the sky
- **Game Boy Style**: Authentic Game Boy appearance with D-pad and button controls

## Controls

### Keyboard Controls

- **Left/Right Arrow Keys**: Move left or right
- **A Key or Enter**: Start game / Confirm selection in menus
- **B Key**: Return to game from settings
- **Escape Key**: Open settings menu

### Game Boy Controls

- **D-pad**: Move left/right during gameplay, navigate in menus
- **A Button**: Start game / Confirm selection
- **B Button**: Return to game from settings
- **START Button**: Start the game
- **SELECT Button**: Open settings menu

### Settings

Access the settings menu by pressing the SELECT button or ESC key. Options include:
- Gravity Control: Use device tilt to control movement (mobile devices only)
- Fullscreen Mode: Toggle fullscreen display
- Author information

## How It Works

The game uses Next.js with React for the frontend and implements the game loop using React hooks. The difficulty system dynamically adjusts platform generation, power-up frequency, and other game mechanics based on your score.

## Technology Stack

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## Getting Started

First, clone the repository and install dependencies:

```bash
git clone https://github.com/stvlynn/doodle-jump-shadcn.git
cd doodle-jump-shadcn
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to play the game.


## Author

[Steven Lynn](https://github.com/stvlynn)

## License

[AGPL-3.0](./LICENSE)

## 数据库设置

本项目使用Supabase作为后端数据库。有两种连接方式：

### 方法1: 使用Supabase JavaScript客户端

适用于需要利用Supabase内置功能（如认证、存储等）的场景。

1. 创建`.env.local`文件，设置以下环境变量：
```
NEXT_PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的公共匿名密钥
SUPABASE_SERVICE_KEY=你的服务角色密钥
```

2. 使用示例：
```typescript
// 服务器组件中使用
import { createClient } from '@/utils/supabase/server';

export default async function Page() {
  const supabase = createClient();
  const { data } = await supabase.from('leaderboard').select();
  // ...
}
```

### 方法2: 使用PostgreSQL.js直接连接

适用于需要执行复杂SQL查询或优化数据库连接的场景。

1. 设置数据库URL环境变量：
```
# 持久连接模式（适合长时间运行的应用）
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres

# 连接池模式（适合无服务器环境）
DATABASE_URL=postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

2. 使用示例：
```typescript
import sql from '@/lib/postgres';

// 简单查询
const leaderboard = await sql`
  SELECT * FROM leaderboard 
  ORDER BY "doodleScore" DESC 
  LIMIT 10
`;

// 带参数的查询
const userId = 'user123';
const userScores = await sql`
  SELECT * FROM leaderboard 
  WHERE "TwitterID" = ${userId}
`;
```

## 数据库表初始化

运行`scripts/setup-db.sql`中的SQL语句来初始化数据库表。你可以在Supabase管理面板的SQL编辑器中执行这些语句。

## 示例页面

- `/instruments`: 展示如何从Supabase读取数据的示例页面
- `/postgres-demo`: 使用PostgreSQL.js直接查询数据库的示例页面

## API路由

- `/api/leaderboard`: 使用Supabase客户端的排行榜API
- `/api/pg-leaderboard`: 使用PostgreSQL.js的排行榜API

## 部署注意事项

在Vercel上部署时，确保设置以下环境变量：

1. `NEXT_PUBLIC_SUPABASE_URL`: Supabase项目URL
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase匿名密钥
3. `SUPABASE_SERVICE_KEY`: Supabase服务角色密钥
4. `DATABASE_URL`: 如果使用PostgreSQL.js，设置PostgreSQL连接URL
