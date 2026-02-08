# Slack to Notion Knowledge Base

SlackチャンネルのURL含む投稿を自動的にNotionデータベースに保存するGAS（Google Apps Script）ベースのツール。

## 概要

- **目的**: SlackでシェアされたURL付き投稿を自動的にNotionに蓄積
- **実装**: Google Apps Script（無料・商用利用可能）
- **実行間隔**: 1分間隔（GASトリガー）
- **除外機能**: 社内環境URLは自動的に除外

## 特徴

- ✅ サーバー不要（Googleインフラで完結）
- ✅ 無料 & 商用利用可能
- ✅ 社内URLパターンで自動フィルタリング
- ✅ Notionデータベースで後から分類・タグ付け可能

## セットアップ

詳細は [docs/SETUP.md](./docs/SETUP.md) を参照。

### クイックスタート

1. Slack App作成 & Bot Token取得
2. Notion Integration作成 & Token取得
3. Notionデータベース作成 & Integrationを接続
4. GASプロジェクト作成 & コード配置
5. 環境変数設定 & トリガー作成

## ディレクトリ構成

```
slack-to-notion/
├── src/
│   └── Code.gs              # GASメインコード
├── docs/
│   ├── SETUP.md             # セットアップ手順
│   └── INTERNAL_PATTERNS.md # 社内URLパターン設定
├── config/
│   └── internal-patterns.example.js # 社内URLパターン例
└── README.md
```

## ライセンス

MIT License

## 作成者

nomuraya
