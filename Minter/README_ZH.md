<div align="center">
<h2><a href="README.md">English</a>  中文</h2>
</div>

# N20-WuKong 挖矿

N20-WuKong 智能合约挖矿演示DAPP。


此应用程序支持通过 ChainBow 钱包、Unisat 钱包和 NOTEMarket 钱包（使用 <a href='https://github.com/NoteScan/n20-connect'>n20-connect</a>）连接到 NOTE BTC 网络。

## 部署于 Vercel 上的演示DAPP

建议在ChainBow的DAPP中访问：
https://n20-wukong-demo.vercel.app/
或
https://wukong.notescan.io


## 安装

1. 克隆仓库并导航到项目目录：

```bash
git clone https://github.com/NoteScan/N20-WuKong
cd N20-WuKong/Minter
```

2. 使用 pnpm 安装依赖项：

```bash
pnpm i
```

## 运行

启动开发服务器：

```bash
pnpm start
```

在您的网络浏览器中访问 http://localhost:3000 以访问应用程序。

# 部署到 Vercel
. 将 https://github.com/NoteScan/N20-WuKong fork 到您的 Github 账户。

. 修改 siteMetadata.js 以更新站点标题、电子邮件、Twitter、YouTube 和其他详细信息。

. 在 Vercel 上创建一个新项目。

. 导入您 fork 的仓库，并在项目配置页面中将 **Root Directory** 更改为 **Minter**，然后在 Vercel 上部署。


# 许可证

[MIT](./LICENSE)
