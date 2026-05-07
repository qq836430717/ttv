# 🎬 ttv - IPTV 源自动更新工具

一个自动化的 IPTV 频道源采集、去重、测活和分组工具，支持 GitHub Actions 定时更新。

## ✨ 功能特性

- 🌐 **多源采集** - 聚合多个 IPTV 公开源
- 🔄 **自动去重** - 智能识别重复频道
- 🔍 **健康检测** - HTTP HEAD + GET 双方案测活
- 📊 **智能分组** - 按类型自动归类（央视、卫视、港澳台、体育等）
- 📦 **双格式输出** - 生成 M3U 和 TXT 格式
- ⏰ **定时更新** - GitHub Actions 自动化调度
- 🚀 **手动触发** - 支持临时手动运行

### GitHub Actions 自动化

1. Fork 本仓库到你的账户
2. 在 GitHub 项目设置中启用 Actions
3. 脚本将在每天 **UTC 02:00**（北京时间 10:00）自动运行
4. 也可以在 Actions 选项卡手动触发

## 📥 数据源

脚本聚合以下公开源（可根据需要修改）：

```javascript
const SOURCES = [
  'https://raw.githubusercontent.com/YueChan/Live/main/APTV.m3u',
  'https://raw.githubusercontent.com/iptv-org/iptv/master/streams/cn.m3u',
  'https://raw.githubusercontent.com/fanmingming/live/main/tv/m3u/ipv6.m3u',
  'https://raw.githubusercontent.com/zhumeng11/IPTV/main/IPTV.m3u',
  'https://raw.githubusercontent.com/kimwang1978/collect-tv-txt/main/merged_output.txt'
];
```

修改方式：编辑 `iptv-updater.js` 中的 `SOURCES` 数组

## 🔧 依赖要求

- Node.js 20+
- Git（仅用于 GitHub Actions）

## 📈 性能参数

- 批处理大小：60 条链接/批
- 测活超时：HEAD 5 秒，GET 3 秒
- 源下载超时：10 秒

## ⚠️ 注意事项

1. **网络环境** - 部分源可能需要梯子访问
2. **频道稳定性** - 某些链接可能不稳定，多次运行结果可能有差异
3. **测活时间** - 完整测活可能需要 3-5 分钟
4. **API EPG** - 默认使用 `epg.51zmt.top`，可替换为其他 EPG 源

## 🤝 贡献指南

欢迎增加新的数据源或改进分组逻辑。直接编辑 `iptv-updater.js` 后提交 PR 即可。

## 📄 许可证

MIT License

## 🙏 致谢

感谢各开源 IPTV 源的贡献者！
