# セットアップ手順

## 前提条件

- Slackワークスペースの管理者権限（App作成のため）
- Notionワークスペースへのアクセス権限
- Googleアカウント（GAS実行のため）

## セットアップフロー

```
1. Slack App作成 → Bot Token取得
2. Notion Integration作成 → Token取得
3. Notionデータベース作成 → Integration接続
4. GASプロジェクト作成 → コード配置
5. 環境変数設定
6. トリガー作成
7. 動作確認
```

---

## 1. Slack App作成

### 1-1. Appを作成

1. https://api.slack.com/apps にアクセス
2. **Create New App** をクリック
3. **From scratch** を選択
4. App Name: `Notion Knowledge Bot`（任意）
5. Workspace: 対象のワークスペースを選択
6. **Create App** をクリック

### 1-2. Bot Token Scopesを追加

1. 左メニュー **OAuth & Permissions** をクリック
2. **Scopes** セクションの **Bot Token Scopes** に以下を追加:
   - `channels:history` - チャンネルのメッセージ履歴を読む
   - `channels:read` - チャンネル情報を読む

### 1-3. Workspaceにインストール

1. **OAuth & Permissions** ページの上部
2. **Install to Workspace** をクリック
3. 権限を確認して **許可する** をクリック
4. **Bot User OAuth Token** が表示される（`xoxb-...` で始まる）
5. このトークンをコピーして保存

### 1-4. チャンネルにBotを追加

1. Slackで対象チャンネルを開く
2. チャンネル名をクリック → **インテグレーション** タブ
3. **アプリを追加する** → 作成したAppを追加

### 1-5. チャンネルIDを取得

1. 対象チャンネルを開く
2. チャンネル名をクリック
3. 下部の **その他** → **チャンネルの詳細をコピー** → **ID** 欄の値をコピー（`C...` で始まる）

---

## 2. Notion Integration作成

### 2-1. Integrationを作成

1. https://www.notion.so/my-integrations にアクセス
2. **New integration** をクリック
3. 名前: `Slack Knowledge Bot`（任意）
4. Associated workspace: 対象のワークスペースを選択
5. **Submit** をクリック

### 2-2. Tokenを取得

1. 作成したIntegrationのページで **Internal Integration Token** をコピー（`secret_...` で始まる）
2. このトークンを保存

---

## 3. Notionデータベース作成

### 3-1. データベースを作成

1. Notionで新しいページを作成
2. `/database` と入力 → **Table - Inline** を選択
3. データベース名: `Slack Knowledge Base`（任意）

### 3-2. プロパティを追加

以下のプロパティを作成（順不同）:

| プロパティ名 | タイプ | 説明 |
|------------|--------|------|
| Name | タイトル | デフォルトで存在（投稿の冒頭100文字） |
| Content | テキスト | 投稿全文 |
| URLs | テキスト | 抽出されたURL一覧 |
| Source | URL | Slackメッセージへのリンク |
| Date | 日付 | 投稿日時 |
| Category | セレクト | （後から手動分類用、オプション） |
| Tags | マルチセレクト | （後から手動タグ付け用、オプション） |

**プロパティ追加手順**:
1. データベースの右上 **+** アイコンをクリック
2. プロパティタイプを選択
3. プロパティ名を入力

### 3-3. Integrationを接続

1. データベースページの右上 **...** → **Connections** をクリック
2. 作成したIntegration（`Slack Knowledge Bot`）を検索して追加
3. **確認** をクリック

### 3-4. Database IDを取得

1. データベースページのURLをコピー
2. URLの形式: `https://www.notion.so/{workspace}/{database-id}?v={view-id}`
3. `database-id` 部分（32文字のハイフン区切り）をコピー
   - 例: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

---

## 4. GASプロジェクト作成

### 4-1. プロジェクトを作成

1. https://script.google.com にアクセス
2. **新しいプロジェクト** をクリック
3. プロジェクト名: `Slack to Notion`（任意）

### 4-2. コードを配置

1. `Code.gs` ファイルを開く（デフォルトで存在）
2. デフォルトのコードを削除
3. [`src/Code.gs`](../src/Code.gs) の内容を全てコピー&ペースト
4. **Ctrl+S** で保存

---

## 5. 環境変数設定

### 方法A: 対話的に設定（推奨）

1. GASエディタで `setup` 関数を選択
2. **実行** ボタンをクリック
3. 初回実行時、権限の承認を求められる:
   - **権限を確認** → Googleアカウントを選択
   - **詳細** → **Slack to Notion（安全ではないページ）に移動** をクリック
   - **許可** をクリック
4. プロンプトに従って以下を入力:
   - Slack Bot Token（`xoxb-...`）
   - Notion Token（`secret_...`）
   - Notion Database ID
   - Slack Channel ID（`C...`）
   - Slack Workspace名（例: `yourworkspace`）

### 方法B: コードで直接設定

1. `setupDirect` 関数内の値を編集:
   ```javascript
   props.setProperty('SLACK_BOT_TOKEN', 'xoxb-your-actual-token');
   props.setProperty('NOTION_TOKEN', 'secret_your-actual-token');
   props.setProperty('NOTION_DATABASE_ID', 'your-actual-database-id');
   props.setProperty('SLACK_CHANNEL_ID', 'C1234567890');
   props.setProperty('SLACK_WORKSPACE', 'yourworkspace');
   ```
2. `setupDirect` 関数を実行

---

## 6. トリガー作成

### 6-1. トリガーを作成

1. GASエディタで `createTrigger` 関数を選択
2. **実行** ボタンをクリック
3. 実行ログに「トリガー作成完了（1分間隔）」と表示されることを確認

### 6-2. トリガーを確認

1. 左メニュー **トリガー** アイコン（時計マーク）をクリック
2. `processSlackMessages` 関数が1分間隔で実行されることを確認

---

## 7. 動作確認

### 7-1. テスト実行

1. GASエディタで `testRun` 関数を選択
2. **実行** ボタンをクリック
3. 実行ログを確認:
   - エラーがないか確認
   - 「新規メッセージなし」または「X件の新規メッセージを処理」と表示されることを確認

### 7-2. 実際の動作確認

1. Slackの対象チャンネルにURL含む投稿をする
   - 例: `これ便利そう https://example.com`
2. 1〜2分待つ（トリガーが実行されるまで）
3. Notionデータベースに新しいページが作成されていることを確認

### 7-3. 社内URL除外の確認

1. Slackに社内URL含む投稿をする
   - 例: `社内Jira https://jira.yourcompany.com/browse/PROJECT-123`
2. 1〜2分待つ
3. Notionに保存されないことを確認

---

## トラブルシューティング

### エラー: `Slack API error: invalid_auth`

**原因**: Slack Bot Tokenが間違っている

**対処**:
1. Slack Appの **OAuth & Permissions** でBot User OAuth Tokenを再確認
2. `setupDirect` 関数で正しいトークンを設定し直す

### エラー: `Notion API error: unauthorized`

**原因**: Notion IntegrationがデータベースにConnectされていない

**対処**:
1. Notionデータベースページの右上 **...** → **Connections**
2. 作成したIntegrationが追加されていることを確認

### エラー: `Notion API error: validation_error`

**原因**: データベースのプロパティ名が一致していない

**対処**:
1. Notionデータベースのプロパティ名を確認
2. コード内の `properties` オブジェクトのキー名と一致させる
   - 大文字・小文字の違いに注意

### メッセージがNotionに保存されない

**考えられる原因**:

1. **URL含まない投稿**: テキストのみの投稿は保存されない
2. **社内URLのみ**: 社内URLパターンに一致するURLのみの投稿は保存されない
3. **トリガー未起動**: `createTrigger` 関数を実行していない

**確認手順**:
1. GASエディタの **実行数** タブでログを確認
2. `testRun` 関数を手動実行してログを確認

### 実行ログの確認方法

1. GASエディタの左メニュー **実行数** タブをクリック
2. 最新の実行を選択
3. ログを確認

---

## 社内URLパターンのカスタマイズ

### パターンの追加

`Code.gs` の `INTERNAL_PATTERNS` 配列に正規表現を追加:

```javascript
const INTERNAL_PATTERNS = [
  // 既存パターン...

  // 社内ツール例
  /https?:\/\/jira\.yourcompany\.com/,
  /https?:\/\/confluence\.yourcompany\.com/,
  /https?:\/\/github\.yourcompany\.com/,
  /https?:\/\/.*\.yourcompany\.internal/,
];
```

### パターンのテスト

1. GASエディタで以下を追加:
   ```javascript
   function testInternalPattern() {
     const testUrls = [
       'https://jira.yourcompany.com/browse/PROJECT-123',
       'https://example.com',
       'https://192.168.1.1',
     ];

     testUrls.forEach(url => {
       const isInternal = isInternalUrl(url);
       Logger.log(`${url}: ${isInternal ? '社内URL' : '外部URL'}`);
     });
   }
   ```
2. `testInternalPattern` 関数を実行
3. ログで判定結果を確認

詳細は [INTERNAL_PATTERNS.md](./INTERNAL_PATTERNS.md) を参照。

---

## メンテナンス

### トリガーの停止

1. GASエディタで `deleteTrigger` 関数を実行
2. または、左メニュー **トリガー** から手動で削除

### 環境変数の更新

1. `setupDirect` 関数内の値を編集
2. 関数を再実行

### ログのクリーンアップ

GASの実行ログは自動的に削除されるため、手動クリーンアップは不要。

---

## 次のステップ

- [社内URLパターンのカスタマイズ](./INTERNAL_PATTERNS.md)
- Notionデータベースでのカテゴリ・タグ分類
- 定期的なレビューと整理

---

## サポート

問題が解決しない場合は、以下の情報を添えてIssueを作成してください:

- エラーメッセージ全文
- 実行ログ（GAS **実行数** タブのスクリーンショット）
- 実行環境（Slack Workspace名、Notion Workspace名）
