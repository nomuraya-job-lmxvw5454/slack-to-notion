# セットアップ手順

## 前提条件

- Slackワークスペースの管理者権限（App作成のため）
- Notionワークスペースへのアクセス権限
- Googleアカウント（GAS実行のため）

## アーキテクチャ

Push型（Events API）を採用。SlackからGASにリアルタイムでメッセージが届く仕組み。

```
Slackチャンネルに投稿
    ↓
Slack Events API が GAS の URL に POST
    ↓
GAS doPost() でメッセージ受信
    ↓
URL検出 & 社内URL除外
    ↓
Notion保存
```

ポーリング方式と異なり、メッセージが投稿された時だけ処理するため、
重複登録のリスクが構造的に排除される。

## セットアップフロー

```
1. Slack App作成
2. Notion Integration作成 → Token取得
3. Notionデータベース作成 → Integration接続
4. GASプロジェクト作成 → コード配置 → デプロイ
5. 環境変数設定
6. Slack Events API にGASのURLを登録
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

### 1-2. Signing Secretを取得

1. **Basic Information** ページ
2. **App Credentials** セクション
3. **Signing Secret** の値をコピーして保存

### 1-3. Workspaceにインストール

1. 左メニュー **OAuth & Permissions** をクリック
2. **Install to Workspace** をクリック
3. 権限を確認して **許可する** をクリック

### 1-4. チャンネルにBotを追加

1. Slackで対象チャンネルを開く
2. チャンネル名をクリック → **インテグレーション** タブ
3. **アプリを追加する** → 作成したAppを追加

### 1-5. チャンネルIDを取得

1. 対象チャンネルを開く
2. チャンネル名をクリック
3. 下部にチャンネルIDが表示される（`C...` で始まる）
4. コピーして保存

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

## 4. GASプロジェクト作成 & デプロイ

### 4-1. プロジェクトを作成

1. https://script.google.com にアクセス
2. **新しいプロジェクト** をクリック
3. プロジェクト名: `Slack to Notion`（任意）

### 4-2. コードを配置

1. `Code.gs` ファイルを開く（デフォルトで存在）
2. デフォルトのコードを削除
3. [`src/Code.gs`](../src/Code.gs) の内容を全てコピー&ペースト
4. **Ctrl+S** で保存

### 4-3. Webアプリとしてデプロイ

1. GASエディタ上部 **デプロイ** → **新しいデプロイ**
2. 左上の歯車アイコン → **ウェブアプリ** を選択
3. 設定:
   - 説明: `Slack to Notion Knowledge Bot`
   - 次のユーザーとして実行: **自分**
   - アクセスできるユーザー: **全員**
4. **デプロイ** をクリック
5. 初回は権限の承認が必要:
   - **アクセスを承認** → Googleアカウントを選択
   - **詳細** → **Slack to Notion（安全ではないページ）に移動** → **許可**
6. **ウェブアプリのURL** が表示される
   - `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec`
   - このURLをコピーして保存（Slack設定で使用）

---

## 5. 環境変数設定

### コードで直接設定

1. GASエディタで `setupDirect` 関数内の値を編集:
   ```javascript
   props.setProperty('NOTION_TOKEN', 'secret_your-actual-token');
   props.setProperty('NOTION_DATABASE_ID', 'your-actual-database-id');
   props.setProperty('SLACK_CHANNEL_ID', 'C1234567890');
   props.setProperty('SLACK_WORKSPACE', 'yourworkspace');
   props.setProperty('SLACK_SIGNING_SECRET', 'your-slack-signing-secret');
   ```
2. `setupDirect` 関数を選択して **実行**
3. 実行ログに「設定完了」と表示されることを確認

---

## 6. Slack Events API にGASのURLを登録

### 6-1. Event Subscriptionsを有効化

1. https://api.slack.com/apps → 作成したAppを選択
2. 左メニュー **Event Subscriptions** をクリック
3. **Enable Events** を **On** に切り替え

### 6-2. Request URLを設定

1. **Request URL** 欄にGASのWebアプリURLを貼り付け:
   - `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec`
2. Slackが自動的にURL Verificationリクエストを送信
3. **Verified** と表示されれば成功

### 6-3. Subscribe to bot eventsを追加

1. **Subscribe to bot events** セクションを展開
2. **Add Bot User Event** をクリック
3. `message.channels` を追加（パブリックチャンネルのメッセージ）
4. **Save Changes** をクリック

### 6-4. Appを再インストール

1. 左メニュー **OAuth & Permissions** に移動
2. **Reinstall to Workspace** をクリック
3. 権限を確認して **許可する**

---

## 7. 動作確認

### 7-1. テスト実行（サンプルイベント）

1. GASエディタで `testWithSampleEvent` 関数を選択
2. **実行** ボタンをクリック
3. 実行ログを確認:
   - 「Notion保存成功」と表示されれば成功
   - Notionデータベースにテストデータが追加されていることを確認

### 7-2. 実際の動作確認

1. Slackの対象チャンネルにURL含む投稿をする
   - 例: `これ便利そう https://example.com`
2. 数秒〜10秒程度で（ポーリングではないのでほぼリアルタイム）
3. Notionデータベースに新しいページが作成されていることを確認

### 7-3. 社内URL除外の確認

1. Slackに社内URLのみの投稿をする
   - 例: `社内Wiki https://192.168.1.100/wiki`
2. Notionに保存**されない**ことを確認

### 7-4. 社内URLパターンのテスト

1. GASエディタで `testInternalPatterns` 関数を実行
2. ログで各URLの判定結果を確認

---

## トラブルシューティング

### URL Verificationが失敗する

**原因**: GASがデプロイされていない、またはURLが間違っている

**対処**:
1. GASエディタ → **デプロイ** → **デプロイを管理** でURLを確認
2. 「アクセスできるユーザー: 全員」になっているか確認
3. URLをブラウザで開いて何らかのレスポンスが返るか確認

### メッセージがNotionに保存されない

**確認手順**:
1. GASエディタの **実行数** タブでログを確認
2. `doPost` が呼ばれているかチェック

**考えられる原因**:

| 原因 | 対処 |
|------|------|
| Events APIの設定が間違っている | `message.channels` が登録されているか確認 |
| BotがチャンネルにInviteされていない | チャンネルのインテグレーションで追加 |
| URL含まない投稿 | テキストのみの投稿は対象外 |
| 社内URLのみ | 社内URLパターンに一致するURLのみの投稿は対象外 |
| SLACK_CHANNEL_IDが間違っている | `setupDirect` で正しいIDを設定 |

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

### 重複リトライ

**原因**: GASの処理が3秒以上かかり、Slackがリトライしている

**確認**: ログに「リトライ検出」「重複イベント検出」が出ていれば正常に防止できている

**対処**: 特に不要（コード側で自動的にスキップしている）

### 実行ログの確認方法

1. GASエディタの左メニュー **実行数** タブをクリック
2. 最新の実行を選択
3. ログを確認

---

## コードを更新した場合の再デプロイ

GASのコードを修正した場合、Webアプリを再デプロイする必要があります。

1. GASエディタ → **デプロイ** → **デプロイを管理**
2. 既存のデプロイの右上の鉛筆アイコンをクリック
3. **バージョン** → **新バージョン** を選択
4. **デプロイ** をクリック

URLは変わりません。Slackの設定を変更する必要はありません。

---

## メンテナンス

### 一時停止

Events APIを無効化:
1. https://api.slack.com/apps → App選択
2. **Event Subscriptions** → **Enable Events** を **Off**

### 環境変数の更新

1. `setupDirect` 関数内の値を編集
2. 関数を再実行

### ログのクリーンアップ

GASの実行ログは自動的に削除されるため、手動クリーンアップは不要。

---

## 社内URLパターンのカスタマイズ

詳細は [INTERNAL_PATTERNS.md](./INTERNAL_PATTERNS.md) を参照。

---

## サポート

問題が解決しない場合は、以下の情報を添えてIssueを作成してください:

- エラーメッセージ全文
- 実行ログ（GAS **実行数** タブのスクリーンショット）
- 実行環境（Slack Workspace名、Notion Workspace名）
