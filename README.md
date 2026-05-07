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

## 🔧 依赖要求

- Node.js 20+
- Git（仅用于 GitHub Actions）

## 📄 许可证

MIT License

## 🙏 致谢

感谢各开源 IPTV 源的贡献者！
