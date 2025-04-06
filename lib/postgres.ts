import postgres from 'postgres';

// 检查环境变量
if (!process.env.DATABASE_URL) {
  console.warn('找不到数据库URL，请确保设置了DATABASE_URL环境变量');
}

// Supabase连接URL格式：
// 直接连接: postgresql://postgres:[YOUR-PASSWORD]@db.ocuuwoivajgckizstnpu.supabase.co:5432/postgres
// 连接池: postgresql://postgres.ocuuwoivajgckizstnpu:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres

// 创建PostgreSQL客户端
const sql = postgres(process.env.DATABASE_URL || '', {
  ssl: true,  // 确保启用SSL连接
  max: 10,    // 连接池大小
  idle_timeout: 20,  // 空闲超时（秒）
  connect_timeout: 10, // 连接超时（秒）
});

export default sql; 