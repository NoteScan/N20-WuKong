<div align="center">
<h2><a href="README.md">English</a>  中文</h2>
</div>

# WuKong 智能合约

此智能合约使用 sCrypt 编写, 遵循 [NOTE 协议](https://noteprotocol.org).

该合约具有自适应挖矿难度，会根据挖矿进度进行调整，最高有 9 个难度级别。代币总供应量被分为 9 部分，每挖完一部分后，挖矿难度会增加四倍。
挖矿过程中有大约10% (25/256)几率发生“暴击"，即挖矿收益翻倍。

## 入门指南

按照以下步骤设置和测试智能合约。

### 先决条件

- [Node.js](https://nodejs.org/)
- [sCrypt 比特币脚本语言](https://docs.scrypt.io/)
- [NOTE 协议](https://noteprotocol.org/)

### 安装

1. 克隆仓库:

```bash
git clone https://github.com/NoteScan/N20-WuKong
cd N20-WuKong/SmartContract
```

2. 安装依赖项

```bash
pnpm i
```

### 使用

编译合约：

```bash
pnpm compile
```

测试合约：

```bash
pnpm test
```

## 许可证

MIT
