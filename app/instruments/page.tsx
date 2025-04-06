import { createClient } from '@/utils/supabase/server';

export default async function Instruments() {
  const supabase = createClient();
  
  // 从Supabase查询示例仪器数据
  const { data: instruments, error } = await supabase
    .from("instruments")
    .select();
  
  if (error) {
    console.error('查询失败:', error.message);
    return <div>查询失败: {error.message}</div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">乐器列表</h1>
      {instruments && instruments.length > 0 ? (
        <ul className="space-y-2">
          {instruments.map((instrument: any) => (
            <li key={instrument.id} className="p-2 bg-gray-100 rounded">
              {instrument.name}
            </li>
          ))}
        </ul>
      ) : (
        <p>没有找到乐器数据。请确保数据库中创建了instruments表。</p>
      )}
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
        <h2 className="text-xl font-semibold mb-2">使用Supabase的示例代码</h2>
        <pre className="bg-black text-white p-4 rounded overflow-x-auto">
          {`// 服务器组件中使用Supabase
import { createClient } from '@/utils/supabase/server';

export default async function Page() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from("table_name")
    .select();
    
  // 处理数据...
}`}
        </pre>
      </div>
    </div>
  );
} 