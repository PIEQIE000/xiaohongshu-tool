export default function Home() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">欢迎使用小红书内容运营工具</h1>
      <p className="text-muted-foreground mb-6">铝单板行业内容生产与运营管理平台</p>
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-2xl bg-card text-card-foreground shadow-lg p-6">
          <p className="text-sm text-muted-foreground mb-1">选题总数</p>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="rounded-2xl bg-card text-card-foreground shadow-lg p-6">
          <p className="text-sm text-muted-foreground mb-1">写作中</p>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="rounded-2xl bg-card text-card-foreground shadow-lg p-6">
          <p className="text-sm text-muted-foreground mb-1">已完成</p>
          <p className="text-3xl font-bold">0</p>
        </div>
        <div className="rounded-2xl bg-card text-card-foreground shadow-lg p-6">
          <p className="text-sm text-muted-foreground mb-1">已发布</p>
          <p className="text-3xl font-bold">0</p>
        </div>
      </div>
    </div>
  )
}
