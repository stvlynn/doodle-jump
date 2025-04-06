import sql from '@/lib/postgres';

export const dynamic = 'force-dynamic'; // 确保服务器端渲染每次请求

export default async function PostgresDemo() {
  try {
    // 使用PostgreSQL.js直接查询数据库
    // 查询排行榜前10名
    const leaderboard = await sql`
      SELECT 
        "TwitterID", 
        "TwitterName", 
        "TwitterAvatar", 
        "doodleScore",
        created_at
      FROM leaderboard
      ORDER BY "doodleScore" DESC
      LIMIT 10
    `;
    
    // 确保模板字符串中不引用外部变量
    const codeExample = `import sql from '@/lib/postgres';

// 简单查询
const users = await sql\`SELECT * FROM users\`;

// 带参数的查询
const name = 'John';
const age = 30;
const usersWithParams = await sql\`
  SELECT * FROM users 
  WHERE name = \${name} AND age > \${age}
\`;

// 事务
const result = await sql.begin(async (sql) => {
  const { count } = await sql\`SELECT count(*) FROM users\`;
  return count;
});`;
    
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">PostgreSQL.js 直接查询示例</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl mb-4">排行榜前10名</h2>
          
          {leaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">排名</th>
                    <th className="border p-2 text-left">用户</th>
                    <th className="border p-2 text-left">分数</th>
                    <th className="border p-2 text-left">提交时间</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr key={entry.TwitterID + index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="border p-2">{index + 1}</td>
                      <td className="border p-2 flex items-center">
                        {entry.TwitterAvatar && (
                          <img 
                            src={entry.TwitterAvatar} 
                            alt={entry.TwitterName} 
                            className="w-8 h-8 rounded-full mr-2"
                          />
                        )}
                        {entry.TwitterName}
                      </td>
                      <td className="border p-2">{entry.doodleScore}</td>
                      <td className="border p-2">
                        {new Date(entry.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>暂无数据</p>
          )}
        </div>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
          <h2 className="text-xl font-semibold mb-2">PostgreSQL.js 代码示例</h2>
          <pre className="bg-black text-white p-4 rounded overflow-x-auto">
            {codeExample}
          </pre>
        </div>
      </div>
    );
  } catch (error) {
    console.error('PostgreSQL查询错误:', error);
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">PostgreSQL.js 示例</h1>
        <div className="bg-red-50 text-red-700 p-4 rounded">
          <h2 className="font-bold">查询错误</h2>
          <p>{error instanceof Error ? error.message : '未知错误'}</p>
          <p className="mt-4 text-sm">
            确保已正确设置环境变量DATABASE_URL，并且数据库中存在leaderboard表。
          </p>
        </div>
      </div>
    );
  }
} 