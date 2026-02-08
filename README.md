# Slack to Notion Knowledge Base

SlackチャンネルのURL含む投稿を自動的にNotionデータベースに保存するGAS（Google Apps Script）ベースのツール。

## 概要

- **目的**: SlackでシェアされたURL付き投稿を自動的にNotionに蓄積
- **実装**: Google Apps Script（無料・商用利用可能）
- **方式**: Push型（Slack Events API → GAS Webアプリ）
- **除外機能**: 社内環境URLは自動的に除外

## 仕組み

```
Slackチャンネルに投稿
    ↓
Slack Events API が GAS にリアルタイムでPOST
    ↓
URL検出 & 社内URL除外
    ↓
Notionデータベースにページ作成
```

- メッセージが来た時だけ処理するため、重複登録のリスクが構造的に排除される
- Slackリトライは `X-Slack-Retry-Num` ヘッダーで即スキップ
- 万が一の重複は `CacheService` で `event_id` を短期キャッシュ（6時間TTL、自動消滅）して防止

## 特徴

- サーバー不要（Googleインフラで完結）
- 無料 & 商用利用可能
- 社内URLパターンで自動フィルタリング
- ほぼリアルタイム（ポーリングではないため遅延なし）
- CLIでデプロイまで完結（clasp）

## クイックスタート

```bash
git clone https://github.com/nomuraya-job-lmxvw5454/slack-to-notion.git
cd slack-to-notion
npm install

npm run login    # Googleアカウントでログイン
npm run create   # GASプロジェクト作成
npm run deploy   # Webアプリとしてデプロイ
```

詳細は [docs/SETUP.md](./docs/SETUP.md) を参照。

## CLIコマンド

| コマンド | 用途 |
|---------|------|
| `npm run login` | Googleアカウントでログイン |
| `npm run create` | GASプロジェクト作成 |
| `npm run push` | コードをGASにアップロード |
| `npm run deploy` | push + Webアプリデプロイ |
| `npm run open` | GASエディタをブラウザで開く |
| `npm run logs` | 実行ログを表示 |

## ディレクトリ構成

```
slack-to-notion/
├── src/
│   ├── Code.gs              # GASメインコード（Events API対応）
│   └── appsscript.json      # GASマニフェスト
├── docs/
│   ├── SETUP.md             # セットアップ手順
│   └── INTERNAL_PATTERNS.md # 社内URLパターン設定
├── config/
│   └── internal-patterns.example.js # 社内URLパターン例
├── .clasp.json.example      # clasp設定例
├── package.json
└── README.md
```

## ライセンス

MIT License
