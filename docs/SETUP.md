# セットアップ手順

## 前提条件

- Node.js（clasp実行用）
- Slackワークスペースの管理者権限
- Notionワークスペースへのアクセス権限
- Googleアカウント

## セットアップフロー

```
1. Slack App作成（Slack管理画面）
2. Notion Integration作成（Notion管理画面）
3. Notionデータベース作成
4. clasp セットアップ & デプロイ（CLI）
5. 環境変数設定（CLI）
6. Slack Events APIにGASのURLを登録（Slack管理画面）
7. 動作確認
```

---

## 1. Slack App作成

### 1-1. Appを作成

1. https://api.slack.com/apps にアクセス
2. **Create New App** → **From scratch**
3. App Name: `Notion Knowledge Bot`（任意）
4. Workspace: 対象のワークスペースを選択
5. **Create App**

### 1-2. Signing Secretを取得

1. **Basic Information** ページ
2. **App Credentials** セクション
3. **Signing Secret** の値をコピー → メモしておく

### 1-3. Workspaceにインストール

1. 左メニュー **OAuth & Permissions**
2. **Install to Workspace** → **許可する**

### 1-4. チャンネルにBotを追加

1. Slackで対象チャンネルを開く
2. チャンネル名クリック → **インテグレーション** → **アプリを追加する**

### 1-5. チャンネルIDを取得

1. 対象チャンネルを開く
2. チャンネル名クリック → 下部にID表示（`C...` で始まる）
3. コピー → メモしておく

---

## 2. Notion Integration作成

### 2-1. Integrationを作成

1. https://www.notion.so/my-integrations にアクセス
2. **New integration**
3. 名前: `Slack Knowledge Bot`（任意）
4. Associated workspace: 対象のワークスペースを選択
5. **Submit**

### 2-2. Tokenを取得

1. **Internal Integration Token** をコピー（`secret_...` で始まる）
2. メモしておく

---

## 3. Notionデータベース作成

### 3-1. データベースを作成

1. Notionで新しいページを作成
2. `/database` → **Table - Inline**
3. データベース名: `Slack Knowledge Base`（任意）

### 3-2. プロパティを追加

| プロパティ名 | タイプ | 説明 |
|------------|--------|------|
| Name | タイトル | デフォルトで存在 |
| Content | テキスト | 投稿全文 |
| URLs | テキスト | 抽出URL一覧 |
| Source | URL | Slackメッセージリンク |
| Date | 日付 | 投稿日時 |
| Category | セレクト | 後から手動分類用（オプション） |
| Tags | マルチセレクト | 後から手動タグ用（オプション） |

### 3-3. Integrationを接続

1. データベースページ右上 **...** → **Connections**
2. 作成したIntegrationを検索して追加

### 3-4. Database IDを取得

1. データベースページのURLをコピー
2. `https://www.notion.so/{workspace}/{database-id}?v={view-id}`
3. `database-id` 部分をコピー → メモしておく

---

## 4. clasp セットアップ & デプロイ

ここからはCLIで完結します。

### 4-1. リポジトリをクローン

```bash
git clone https://github.com/nomuraya-job-lmxvw5454/slack-to-notion.git
cd slack-to-notion
npm install
```

### 4-2. Googleアカウントでログイン

```bash
npm run login
```

ブラウザが開くので、Googleアカウントでログイン → 権限を許可。

### 4-3. GASプロジェクトを作成

```bash
npm run create
```

実行すると：
- GASプロジェクトが自動作成される
- `.clasp.json` が生成される（scriptIdが記録される）

**確認**:
```bash
cat .clasp.json
# → {"scriptId":"xxx","rootDir":"src"} のような内容
```

### 4-4. コードをGASにpush

```bash
npm run push
```

`src/Code.gs` と `src/appsscript.json` がGASプロジェクトにアップロードされる。

### 4-5. Webアプリとしてデプロイ

```bash
npm run deploy
```

デプロイが成功すると、**WebアプリのURL**が表示される:
```
Created version 1.
- {DEPLOYMENT_ID} @1.
```

**WebアプリURLを構成**:
```
https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
```

このURLをメモしておく（ステップ6で使用）。

**初回デプロイの注意**: 初回は権限承認が必要。`npm run open` でGASエディタを開き、任意の関数を1回実行して権限を承認してください。

---

## 5. 環境変数設定

### 5-1. Code.gsの`setupDirect`関数を編集

ステップ1〜3でメモした値を `src/Code.gs` の `setupDirect` 関数に記入:

```javascript
function setupDirect() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('NOTION_TOKEN', 'secret_ここにNotionトークン');
  props.setProperty('NOTION_DATABASE_ID', 'ここにDatabase ID');
  props.setProperty('SLACK_CHANNEL_ID', 'CここにチャンネルID');
  props.setProperty('SLACK_WORKSPACE', 'ここにワークスペース名');
  props.setProperty('SLACK_SIGNING_SECRET', 'ここにSigning Secret');
  Logger.log('設定完了');
}
```

### 5-2. pushして実行

```bash
npm run push
```

次に、GASエディタで `setupDirect` を実行:
```bash
npm run open
```
→ GASエディタが開く → `setupDirect` を選択して実行

**実行後、Code.gsのトークン値を削除してcommitしないこと**（セキュリティ上、push後にローカルの値を元に戻すのを推奨）。

---

## 6. Slack Events APIにGASのURLを登録

### 6-1. Event Subscriptionsを有効化

1. https://api.slack.com/apps → 作成したApp
2. 左メニュー **Event Subscriptions**
3. **Enable Events** → **On**

### 6-2. Request URLを設定

1. **Request URL** にステップ4-5のWebアプリURLを貼り付け:
   ```
   https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
   ```
2. **Verified** と表示されれば成功

### 6-3. Subscribe to bot eventsを追加

1. **Subscribe to bot events** を展開
2. **Add Bot User Event** → `message.channels`
3. **Save Changes**

### 6-4. Appを再インストール

1. 左メニュー **OAuth & Permissions**
2. **Reinstall to Workspace** → **許可する**

---

## 7. 動作確認

### 7-1. テスト（サンプルイベント）

```bash
npm run open
```
GASエディタで `testWithSampleEvent` を実行 → ログに「Notion保存成功」が出ればOK。

### 7-2. 実際の動作確認

1. Slackの対象チャンネルに投稿:
   ```
   これ便利そう https://example.com
   ```
2. 数秒後、Notionデータベースに新しいページが作成されることを確認

### 7-3. 社内URL除外の確認

1. Slackに社内URLのみの投稿:
   ```
   社内Wiki https://192.168.1.100/wiki
   ```
2. Notionに保存**されない**ことを確認

---

## CLIコマンドまとめ

| コマンド | 用途 |
|---------|------|
| `npm run login` | Googleアカウントでログイン |
| `npm run create` | GASプロジェクト作成 |
| `npm run push` | コードをGASにアップロード |
| `npm run deploy` | push + Webアプリデプロイ |
| `npm run open` | GASエディタをブラウザで開く |
| `npm run logs` | 実行ログを表示 |

---

## コード変更時の更新

```bash
# コードを編集後
npm run deploy
```

URLは変わりません。Slackの設定変更は不要です。

---

## トラブルシューティング

### `clasp login` でブラウザが開かない

```bash
npx clasp login --no-localhost
```
URLが表示されるので、手動でブラウザに貼り付け。

### URL Verificationが失敗する

1. デプロイが完了しているか確認: `npm run deploy`
2. GASエディタで任意の関数を1回実行して権限承認済みか確認
3. URLをブラウザで直接開いてレスポンスが返るか確認

### メッセージがNotionに保存されない

1. ログ確認: `npm run logs`
2. `doPost` が呼ばれているかチェック

| 原因 | 対処 |
|------|------|
| Events APIの`message.channels`が未登録 | Slack管理画面で追加 |
| BotがチャンネルにInviteされていない | チャンネルでアプリ追加 |
| SLACK_CHANNEL_IDが間違っている | `setupDirect`で修正 → push |
| URL含まない投稿 | テキストのみは対象外（仕様通り） |
| 社内URLのみ | 社内URLは除外（仕様通り） |

### エラー: `Notion API error: unauthorized`

Notion IntegrationがデータベースにConnectされていない。
→ データベースの **Connections** でIntegrationを追加。

### エラー: `Notion API error: validation_error`

データベースのプロパティ名がコードと一致していない。
→ Name, Content, URLs, Source, Date の名前を確認（大文字小文字に注意）。

---

## 一時停止 & 再開

**停止**: Slack管理画面 → **Event Subscriptions** → **Enable Events** を **Off**

**再開**: 同画面で **On** に戻す

---

## 社内URLパターンのカスタマイズ

`src/Code.gs` の `INTERNAL_PATTERNS` 配列を編集 → `npm run deploy`。

詳細は [INTERNAL_PATTERNS.md](./INTERNAL_PATTERNS.md) を参照。
